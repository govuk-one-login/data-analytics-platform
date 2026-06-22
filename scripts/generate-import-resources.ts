/**
 * Generate a ResourcesToImport JSON file for CloudFormation import change sets.
 *
 * Parses the built template.yaml to find resources with DeletionPolicy: Retain,
 * and resolves their physical identifiers from template properties by substituting
 * parameter values (primarily Environment).
 *
 * This works for disaster recovery — you don't need a live stack, just the template
 * and the environment name.
 *
 * Prerequisites:
 *   npm run iac:build -- main    (creates template.yaml)
 *
 * Usage:
 *   npx tsx scripts/generate-import-resources.ts --environment ENV [--template FILE] [--output FILE]
 *
 * Examples:
 *   npx tsx scripts/generate-import-resources.ts --environment dev
 *   npx tsx scripts/generate-import-resources.ts --environment build --output resources-to-import-build.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  CloudFormationClient,
  DescribeStackResourceCommand,
  ListStackResourcesCommand,
  ListStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { ResourceGroupsTaggingAPIClient, GetResourcesCommand } from '@aws-sdk/client-resource-groups-tagging-api';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');

/**
 * Resource types that CloudFormation does not support for import operations.
 * These must be excluded from the resources-to-import list.
 */
const IMPORT_UNSUPPORTED_TYPES = new Set([
  'AWS::Glue::Table',
  'AWS::Glue::Connection',
  'AWS::Glue::SecurityConfiguration',
  'AWS::Glue::Crawler',
  'AWS::Glue::Job',
  'AWS::S3::BucketPolicy',
  'AWS::CloudTrail::Trail',
  'AWS::Events::Rule',
]);

/**
 * Maps CloudFormation resource types to:
 *  - identifierKey: the key used in the ResourcesToImport JSON
 *  - templateProperty: the property path in the template to extract the value from
 */
const RESOURCE_TYPE_CONFIG: Record<string, { identifierKey: string; templateProperty: string }> = {
  'AWS::S3::Bucket': { identifierKey: 'BucketName', templateProperty: 'BucketName' },
  'AWS::SQS::Queue': { identifierKey: 'QueueUrl', templateProperty: 'QueueName' },
  'AWS::KMS::Key': { identifierKey: 'KeyId', templateProperty: '__AWS_GENERATED__' },
  'AWS::IAM::Role': { identifierKey: 'RoleName', templateProperty: 'RoleName' },
  'AWS::DynamoDB::Table': { identifierKey: 'TableName', templateProperty: 'TableName' },
  'AWS::Lambda::Function': { identifierKey: 'FunctionName', templateProperty: 'FunctionName' },
  'AWS::SNS::Topic': { identifierKey: 'TopicArn', templateProperty: '__AWS_GENERATED__' },
  'AWS::Logs::LogGroup': { identifierKey: 'LogGroupName', templateProperty: 'LogGroupName' },
  'AWS::Glue::Database': { identifierKey: 'DatabaseName', templateProperty: 'DatabaseInput.Name' },
  'AWS::Glue::Crawler': { identifierKey: 'Name', templateProperty: 'Name' },
  'AWS::Glue::Job': { identifierKey: 'Name', templateProperty: 'Name' },
  'AWS::Athena::WorkGroup': { identifierKey: 'Name', templateProperty: 'Name' },
  'AWS::CloudWatch::Alarm': { identifierKey: 'AlarmName', templateProperty: 'AlarmName' },
  'AWS::EC2::VPC': { identifierKey: 'VpcId', templateProperty: '__AWS_GENERATED__' },
  'AWS::EC2::Subnet': { identifierKey: 'SubnetId', templateProperty: '__AWS_GENERATED__' },
  'AWS::EC2::RouteTable': { identifierKey: 'RouteTableId', templateProperty: '__AWS_GENERATED__' },
  'AWS::EC2::SecurityGroup': { identifierKey: 'Id', templateProperty: '__AWS_GENERATED__' },
  'AWS::SecretsManager::Secret': { identifierKey: 'Id', templateProperty: '__AWS_GENERATED__' },
  'AWS::KinesisFirehose::DeliveryStream': {
    identifierKey: 'DeliveryStreamName',
    templateProperty: 'DeliveryStreamName',
  },
  'AWS::RedshiftServerless::Namespace': { identifierKey: 'NamespaceName', templateProperty: 'NamespaceName' },
  'AWS::RedshiftServerless::Workgroup': { identifierKey: 'WorkgroupName', templateProperty: 'WorkgroupName' },
  'AWS::StepFunctions::StateMachine': { identifierKey: 'Arn', templateProperty: '__AWS_GENERATED__' },
};

interface TemplateResource {
  logicalId: string;
  type: string;
  condition?: string;
  propertyLines: string[];
  hasDeletionPolicyRetain: boolean;
}

interface ResourceToImport {
  ResourceType: string;
  LogicalResourceId: string;
  ResourceIdentifier: Record<string, string>;
}

function parseTemplate(templatePath: string): {
  resources: TemplateResource[];
  parameters: Record<string, string>;
  conditions: Record<string, string[]>;
} {
  const content = readFileSync(templatePath, 'utf-8');
  const lines = content.split('\n');

  // Extract parameter defaults
  const parameters: Record<string, string> = {};
  let inParameters = false;
  let currentParam = '';
  for (const line of lines) {
    if (line === 'Parameters:') {
      inParameters = true;
      continue;
    }
    if (inParameters && /^[A-Za-z]/.test(line) && !line.startsWith(' ')) {
      inParameters = false;
      continue;
    }
    if (inParameters) {
      const paramMatch = line.match(/^ {2}([A-Za-z]\w+):$/);
      if (paramMatch) {
        currentParam = paramMatch[1];
        continue;
      }
      const defaultMatch = line.match(/^\s+Default:\s*(.+)$/);
      if (defaultMatch && currentParam) {
        parameters[currentParam] = defaultMatch[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }

  // Extract conditions — map condition name to the environments where it's true
  // Simple conditions: IsX equals environment X
  // Compound conditions (Or): true if any sub-condition is true
  const conditions: Record<string, string[]> = {
    IsDev: ['dev'],
    IsBuild: ['build'],
    IsStaging: ['staging'],
    IsIntegration: ['integration'],
    IsProduction: ['production'],
    IsProductionPreview: ['production-preview'],
    IsDevOrBuild: ['dev', 'build'],
    IsDevBuildOrStaging: ['dev', 'build', 'staging'],
    IsQuicksightEnvironment: ['dev', 'production', 'production-preview'],
    IsSecurePipelinesEnvironment: ['dev', 'build', 'staging', 'integration', 'production'],
    IsManualReferenceDataEnvironment: ['production', 'production-preview'],
    IsADMEnvironment: ['production', 'production-preview'],
  };

  // Also parse conditions from the template to handle any not hardcoded above
  let inConditions = false;
  let currentCondition = '';
  let conditionEnvironments: string[] = [];
  for (const line of lines) {
    if (line === 'Conditions:') {
      inConditions = true;
      continue;
    }
    if (inConditions && /^[A-Za-z]/.test(line) && !line.startsWith(' ')) {
      if (currentCondition && conditionEnvironments.length > 0) {
        conditions[currentCondition] = conditionEnvironments;
      }
      inConditions = false;
      continue;
    }
    if (inConditions) {
      const condMatch = line.match(/^ {2}([A-Za-z]\w+):$/);
      if (condMatch) {
        if (currentCondition && conditionEnvironments.length > 0) {
          conditions[currentCondition] = conditionEnvironments;
        }
        currentCondition = condMatch[1];
        conditionEnvironments = [];
        continue;
      }
      // Pick up "- env" values from Fn::Equals
      const envMatch = line.match(/^\s+- (dev|build|staging|integration|production|production-preview)$/);
      if (envMatch && currentCondition) {
        conditionEnvironments.push(envMatch[1]);
      }
      // Pick up sub-conditions from Fn::Or
      const subCondMatch = line.match(/^\s+- Condition:\s*(\w+)$/);
      if (subCondMatch && conditions[subCondMatch[1]]) {
        conditionEnvironments.push(...conditions[subCondMatch[1]]);
      }
    }
  }
  if (currentCondition && conditionEnvironments.length > 0) {
    conditions[currentCondition] = conditionEnvironments;
  }

  // Extract resources — capture all lines within each resource block
  const resources: TemplateResource[] = [];
  let inResources = false;
  let currentLogicalId = '';
  let currentType = '';
  let currentConditionName: string | undefined;
  let currentPropertyLines: string[] = [];
  let hasRetain = false;
  let inProperties = false;

  const saveResource = () => {
    if (currentLogicalId && currentType && hasRetain) {
      resources.push({
        logicalId: currentLogicalId,
        type: currentType,
        condition: currentConditionName,
        propertyLines: currentPropertyLines,
        hasDeletionPolicyRetain: true,
      });
    }
  };

  for (const line of lines) {
    if (line === 'Resources:') {
      inResources = true;
      continue;
    }
    if (!inResources) continue;

    // Top-level key under Resources (2-space indent)
    const resourceMatch = line.match(/^ {2}([A-Za-z]\w+):$/);
    if (resourceMatch) {
      saveResource();
      currentLogicalId = resourceMatch[1];
      currentType = '';
      currentConditionName = undefined;
      currentPropertyLines = [];
      hasRetain = false;
      inProperties = false;
      continue;
    }

    // New top-level section (no indent) — end of Resources
    if (/^[A-Za-z]/.test(line) && !line.startsWith(' ')) {
      saveResource();
      inResources = false;
      continue;
    }

    if (!currentLogicalId) continue;

    const typeMatch = line.match(/^\s{4}Type:\s*['"]?([^'"]+)['"]?$/);
    if (typeMatch) {
      currentType = typeMatch[1].trim();
      continue;
    }

    const conditionMatch = line.match(/^\s{4}Condition:\s*(\w+)/);
    if (conditionMatch) {
      currentConditionName = conditionMatch[1];
      continue;
    }

    if (line.match(/^\s{4}DeletionPolicy:\s*Retain/)) {
      hasRetain = true;
      continue;
    }

    if (line.match(/^\s{4}Properties:$/)) {
      inProperties = true;
      continue;
    }

    if (inProperties && line.match(/^\s{4}[A-Za-z]/) && !line.match(/^\s{6}/)) {
      inProperties = false;
    }

    if (inProperties) {
      currentPropertyLines.push(line);
    }
  }
  saveResource();

  return { resources, parameters, conditions };
}

function resolveSubstitution(value: string, parameters: Record<string, string>, environment: string): string | null {
  if (!value) return null;

  // Handle !Sub ${Var}-suffix or !Sub '${Var}-suffix'
  let subValue = value;
  const subMatch = value.match(/^!Sub\s+['"]?(.+?)['"]?$/);
  if (subMatch) {
    subValue = subMatch[1];
  } else if (!value.includes('${')) {
    // Plain string value (no substitution needed)
    return value.replace(/^['"]|['"]$/g, '');
  }

  // Replace ${Environment}
  let resolved = subValue.replace(/\$\{Environment\}/g, environment);

  // Replace other parameter references
  for (const [key, val] of Object.entries(parameters)) {
    resolved = resolved.replaceAll(`\${${key}}`, val);
  }

  // If there are still unresolved references (!Ref, !GetAtt, ${AWS::...}), we can't resolve
  if (resolved.includes('${') || resolved.includes('!Ref') || resolved.includes('!GetAtt')) {
    return null;
  }

  return resolved.replace(/^['"]|['"]$/g, '');
}

/**
 * Search property lines for a given property path like "Name" or "DatabaseInput.Name".
 * Handles both direct (6-space indent) and nested (8-space under a parent) properties.
 */
function findPropertyValue(propertyLines: string[], propertyPath: string): string | null {
  const parts = propertyPath.split('.');

  if (parts.length === 1) {
    // Direct property at 6-space indent
    const propName = parts[0];
    for (const line of propertyLines) {
      const match = line.match(new RegExp(`^\\s{6}${propName}:\\s*(.+)$`));
      if (match) return match[1].trim();
    }
    return null;
  }

  // Nested property: find the parent then the child
  const [parent, child] = parts;
  let inParent = false;
  for (const line of propertyLines) {
    if (line.match(new RegExp(`^\\s{6}${parent}:`))) {
      inParent = true;
      continue;
    }
    if (inParent) {
      // Check if we've left the parent block
      if (line.match(/^\s{6}\S/)) break;
      const match = line.match(new RegExp(`^\\s{8}${child}:\\s*(.+)$`));
      if (match) return match[1].trim();
    }
  }
  return null;
}

function getIdentifierValue(
  resource: TemplateResource,
  parameters: Record<string, string>,
  environment: string,
): { key: string; value: string } | null {
  const config = RESOURCE_TYPE_CONFIG[resource.type];
  if (!config) return null;
  if (config.templateProperty === '__AWS_GENERATED__') return null;

  const rawValue = findPropertyValue(resource.propertyLines, config.templateProperty);
  if (!rawValue) return null;

  const resolved = resolveSubstitution(rawValue, parameters, environment);
  if (!resolved) return null;

  // SQS needs QueueUrl not QueueName — construct it if we have account-id
  if (resource.type === 'AWS::SQS::Queue') {
    return { key: 'QueueUrl', value: `__SQS_QUEUE_NAME__:${resolved}` };
  }

  return { key: config.identifierKey, value: resolved };
}

/**
 * Look up physical resource IDs via CloudFormation tags that persist on retained resources.
 * Resources are tagged with aws:cloudformation:logical-id even after stack deletion.
 */
async function lookupResourcesByTag(
  region: string,
  stackName: string,
  logicalIds: { logicalId: string; type: string; identifierKey: string }[],
): Promise<Map<string, string>> {
  const tagging = new ResourceGroupsTaggingAPIClient({ region });
  const results = new Map<string, string>();

  try {
    let paginationToken: string | undefined;
    const allResources: { logicalId: string; arn: string }[] = [];

    do {
      const response = await tagging.send(
        new GetResourcesCommand({
          TagFilters: [{ Key: 'aws:cloudformation:stack-name', Values: [stackName] }],
          PaginationToken: paginationToken,
        }),
      );

      for (const resource of response.ResourceTagMappingList ?? []) {
        const logicalIdTag = resource.Tags?.find(t => t.Key === 'aws:cloudformation:logical-id');
        if (logicalIdTag?.Value && resource.ResourceARN) {
          allResources.push({ logicalId: logicalIdTag.Value, arn: resource.ResourceARN });
        }
      }
      paginationToken = response.PaginationToken;
    } while (paginationToken);

    // Match found resources against what we're looking for
    for (const needed of logicalIds) {
      const found = allResources.find(r => r.logicalId === needed.logicalId);
      if (!found) continue;

      // Extract the physical ID from the ARN based on resource type
      const physicalId = extractPhysicalIdFromArn(found.arn, needed.type, needed.identifierKey);
      if (physicalId) {
        results.set(needed.logicalId, physicalId);
      }
    }
  } catch (e) {
    console.warn(`Warning: Could not query resource tags: ${e}`);
  }

  return results;
}

/** Extract the appropriate physical identifier from an ARN based on resource type. */
function extractPhysicalIdFromArn(arn: string, resourceType: string, identifierKey: string): string | null {
  // For most resources, the physical ID is the last segment of the ARN
  const parts = arn.split(':');
  const lastPart = parts[parts.length - 1] ?? '';
  const resourcePart = lastPart.includes('/') ? lastPart.split('/').pop()! : lastPart;

  switch (resourceType) {
    case 'AWS::EC2::VPC':
    case 'AWS::EC2::Subnet':
    case 'AWS::EC2::RouteTable':
    case 'AWS::EC2::SecurityGroup':
      // ARN format: arn:aws:ec2:region:account:vpc/vpc-id, subnet/subnet-id, etc.
      return lastPart.split('/').pop() ?? null;
    case 'AWS::KMS::Key':
      // ARN format: arn:aws:kms:region:account:key/key-id
      return lastPart.split('/').pop() ?? null;
    case 'AWS::IAM::Role':
      // ARN format: arn:aws:iam::account:role/role-name
      return lastPart.split('/').pop() ?? null;
    case 'AWS::SNS::Topic':
      // ARN is the identifier for SNS topics
      return arn;
    case 'AWS::SecretsManager::Secret':
      // ARN is the identifier for secrets
      return arn;
    default:
      return resourcePart || null;
  }
}

/**
 * Look up physical resource IDs from a deleted stack.
 * CloudFormation retains deleted stack info for 90 days.
 */
async function lookupResourcesFromDeletedStack(
  region: string,
  stackName: string,
  logicalIds: Set<string>,
): Promise<Map<string, { physicalId: string; type: string }>> {
  const cfn = new CloudFormationClient({ region });
  const results = new Map<string, { physicalId: string; type: string }>();

  try {
    // Find the deleted stack ARN
    const listResponse = await cfn.send(new ListStacksCommand({ StackStatusFilter: ['DELETE_COMPLETE'] }));
    const stackArns = (listResponse.StackSummaries ?? [])
      .filter(s => s.StackName === stackName)
      .map(s => s.StackId!)
      .sort(); // oldest first

    if (stackArns.length === 0) return results;

    // Try each deleted stack (oldest first, as it's likely the one with resources)
    for (const arn of stackArns) {
      let nextToken: string | undefined;
      do {
        const resources = await cfn.send(new ListStackResourcesCommand({ StackName: arn, NextToken: nextToken }));
        for (const resource of resources.StackResourceSummaries ?? []) {
          if (resource.LogicalResourceId && logicalIds.has(resource.LogicalResourceId) && resource.PhysicalResourceId) {
            results.set(resource.LogicalResourceId, {
              physicalId: resource.PhysicalResourceId,
              type: resource.ResourceType ?? '',
            });
          }
        }
        nextToken = resources.NextToken;
      } while (nextToken);
      if (results.size > 0) break; // Found resources, stop looking
    }
  } catch (e) {
    console.warn(`Warning: Could not query deleted stacks: ${e}`);
  }

  return results;
}

async function main() {
  const { values } = parseArgs({
    options: {
      environment: { type: 'string' },
      template: { type: 'string', default: resolve(PROJECT_ROOT, 'template.yaml') },
      output: { type: 'string', default: 'resources-to-import.json' },
      region: { type: 'string', default: 'eu-west-2' },
      'account-id': { type: 'string' },
      'stack-name': { type: 'string' },
    },
  });

  if (!values.environment) {
    console.error(
      'Usage: npx tsx scripts/generate-import-resources.ts --environment ENV [--template FILE] [--output FILE] [--account-id ACCOUNT_ID]',
    );
    console.error('\nOptions:');
    console.error('  --environment   Target environment (dev, build, staging, etc.)');
    console.error('  --template      Path to built template.yaml (default: ./template.yaml)');
    console.error('  --output        Output JSON file (default: resources-to-import.json)');
    console.error('  --account-id    AWS account ID (needed to construct SQS queue URLs)');
    console.error('  --region        AWS region (default: eu-west-2)');
    process.exit(1);
  }

  const { resources, parameters, conditions } = parseTemplate(values.template!);
  parameters['Environment'] = values.environment;

  console.log(`Parsed template: ${values.template}`);
  console.log(`Environment: ${values.environment}`);
  console.log(`Found ${resources.length} resources with DeletionPolicy: Retain\n`);

  const resourcesToImport: ResourceToImport[] = [];
  const needsManualLookup: { logicalId: string; type: string; reason: string }[] = [];

  for (const resource of resources) {
    // Skip resources whose condition is not met for this environment
    if (resource.condition) {
      const validEnvironments = conditions[resource.condition];
      if (validEnvironments && !validEnvironments.includes(values.environment)) {
        continue;
      }
    }

    const config = RESOURCE_TYPE_CONFIG[resource.type];
    if (!config) {
      needsManualLookup.push({
        logicalId: resource.logicalId,
        type: resource.type,
        reason: 'unsupported resource type',
      });
      continue;
    }

    if (IMPORT_UNSUPPORTED_TYPES.has(resource.type)) {
      continue;
    }

    if (config.templateProperty === '__AWS_GENERATED__') {
      needsManualLookup.push({
        logicalId: resource.logicalId,
        type: resource.type,
        reason: 'AWS-generated ID — requires CLI lookup',
      });
      continue;
    }

    const identifier = getIdentifierValue(resource, parameters, values.environment);

    if (!identifier) {
      needsManualLookup.push({
        logicalId: resource.logicalId,
        type: resource.type,
        reason: 'could not resolve value from template',
      });
      continue;
    }

    // Handle SQS queue URL construction
    if (identifier.value.startsWith('__SQS_QUEUE_NAME__:')) {
      const queueName = identifier.value.replace('__SQS_QUEUE_NAME__:', '');
      if (values['account-id']) {
        identifier.value = `https://sqs.${values.region}.amazonaws.com/${values['account-id']}/${queueName}`;
      } else {
        needsManualLookup.push({
          logicalId: resource.logicalId,
          type: resource.type,
          reason: `SQS queue "${queueName}" — provide --account-id to resolve URL`,
        });
        continue;
      }
    }

    resourcesToImport.push({
      ResourceType: resource.type,
      LogicalResourceId: resource.logicalId,
      ResourceIdentifier: { [identifier.key]: identifier.value },
    });
  }

  writeFileSync(values.output!, JSON.stringify(resourcesToImport, null, 2));
  console.log(`Resolved ${resourcesToImport.length} resources from template\n`);

  // For resources we couldn't resolve from the template, try looking them up via AWS tags
  if (needsManualLookup.length > 0 && values['stack-name']) {
    console.log(
      `Looking up ${needsManualLookup.length} unresolved resources via AWS tags (stack: ${values['stack-name']})...`,
    );
    const toLookup = needsManualLookup.map(r => ({
      logicalId: r.logicalId,
      type: r.type,
      identifierKey: RESOURCE_TYPE_CONFIG[r.type]?.identifierKey ?? 'Unknown',
    }));

    const found = await lookupResourcesByTag(values.region!, values['stack-name'], toLookup);

    const stillMissing: typeof needsManualLookup = [];
    for (const r of needsManualLookup) {
      const physicalId = found.get(r.logicalId);
      if (physicalId) {
        const config = RESOURCE_TYPE_CONFIG[r.type];
        if (config) {
          resourcesToImport.push({
            ResourceType: r.type,
            LogicalResourceId: r.logicalId,
            ResourceIdentifier: { [config.identifierKey]: physicalId },
          });
        }
      } else {
        stillMissing.push(r);
      }
    }

    console.log(`  Found ${found.size} via tags`);

    // Fallback: look up remaining resources from the deleted stack
    if (stillMissing.length > 0) {
      console.log(`  Looking up ${stillMissing.length} remaining resources from deleted stack...`);
      const missingIds = new Set(stillMissing.map(r => r.logicalId));
      const fromDeletedStack = await lookupResourcesFromDeletedStack(values.region!, values['stack-name'], missingIds);
      console.log(`  Found ${fromDeletedStack.size} from deleted stack`);

      const finallyMissing: typeof needsManualLookup = [];
      for (const r of stillMissing) {
        const entry = fromDeletedStack.get(r.logicalId);
        if (entry) {
          const config = RESOURCE_TYPE_CONFIG[r.type];
          if (config) {
            resourcesToImport.push({
              ResourceType: r.type,
              LogicalResourceId: r.logicalId,
              ResourceIdentifier: { [config.identifierKey]: entry.physicalId },
            });
          } else {
            finallyMissing.push(r);
          }
        } else {
          finallyMissing.push(r);
        }
      }

      // Rewrite output
      writeFileSync(values.output!, JSON.stringify(resourcesToImport, null, 2));
      console.log(`\nGenerated ${values.output} with ${resourcesToImport.length} resources\n`);

      if (finallyMissing.length > 0) {
        console.log(`${finallyMissing.length} resources still need manual lookup:`);
        for (const r of finallyMissing) {
          console.log(`  - ${r.logicalId} (${r.type}): ${r.reason}`);
        }
      }
    } else {
      // Rewrite output with the additional resources
      writeFileSync(values.output!, JSON.stringify(resourcesToImport, null, 2));
      console.log(`\nGenerated ${values.output} with ${resourcesToImport.length} resources\n`);
    }
  } else {
    console.log(`Generated ${values.output} with ${resourcesToImport.length} resources\n`);

    if (needsManualLookup.length > 0) {
      console.log(`${needsManualLookup.length} resources need lookup — pass --stack-name to resolve via AWS tags:`);
      for (const r of needsManualLookup) {
        console.log(`  - ${r.logicalId} (${r.type}): ${r.reason}`);
      }
    }
  }
}

main();
