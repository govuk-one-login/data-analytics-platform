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

const PROJECT_ROOT = resolve(import.meta.dirname, '..');

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
  'AWS::SNS::Topic': { identifierKey: 'TopicArn', templateProperty: 'TopicName' },
  'AWS::Logs::LogGroup': { identifierKey: 'LogGroupName', templateProperty: 'LogGroupName' },
  'AWS::Glue::Database': { identifierKey: 'Name', templateProperty: 'DatabaseInput.Name' },
  'AWS::Glue::Table': { identifierKey: 'Name', templateProperty: 'TableInput.Name' },
  'AWS::Glue::Crawler': { identifierKey: 'Name', templateProperty: 'Name' },
  'AWS::Glue::Job': { identifierKey: 'Name', templateProperty: 'Name' },
  'AWS::Glue::SecurityConfiguration': { identifierKey: 'Name', templateProperty: 'Name' },
  'AWS::Glue::Connection': { identifierKey: 'Name', templateProperty: 'ConnectionInput.Name' },
  'AWS::Athena::WorkGroup': { identifierKey: 'Name', templateProperty: 'Name' },
  'AWS::CloudWatch::Alarm': { identifierKey: 'AlarmName', templateProperty: 'AlarmName' },
  'AWS::Events::Rule': { identifierKey: 'Name', templateProperty: 'Name' },
  'AWS::EC2::VPC': { identifierKey: 'VpcId', templateProperty: '__AWS_GENERATED__' },
  'AWS::EC2::Subnet': { identifierKey: 'SubnetId', templateProperty: '__AWS_GENERATED__' },
  'AWS::EC2::RouteTable': { identifierKey: 'RouteTableId', templateProperty: '__AWS_GENERATED__' },
  'AWS::EC2::SecurityGroup': { identifierKey: 'GroupId', templateProperty: '__AWS_GENERATED__' },
  'AWS::CloudTrail::Trail': { identifierKey: 'TrailName', templateProperty: 'TrailName' },
  'AWS::SecretsManager::Secret': { identifierKey: 'SecretId', templateProperty: 'Name' },
  'AWS::KinesisFirehose::DeliveryStream': {
    identifierKey: 'DeliveryStreamName',
    templateProperty: 'DeliveryStreamName',
  },
  'AWS::RedshiftServerless::Namespace': { identifierKey: 'NamespaceName', templateProperty: 'NamespaceName' },
  'AWS::RedshiftServerless::Workgroup': { identifierKey: 'WorkgroupName', templateProperty: 'WorkgroupName' },
  'AWS::StepFunctions::StateMachine': { identifierKey: 'StateMachineArn', templateProperty: '__AWS_GENERATED__' },
};

interface TemplateResource {
  logicalId: string;
  type: string;
  propertyLines: string[];
  hasDeletionPolicyRetain: boolean;
}

interface ResourceToImport {
  ResourceType: string;
  LogicalResourceId: string;
  ResourceIdentifier: Record<string, string>;
}

function parseTemplate(templatePath: string): { resources: TemplateResource[]; parameters: Record<string, string> } {
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
      const paramMatch = line.match(/^  ([A-Za-z]\w+):$/);
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

  // Extract resources — capture all lines within each resource block
  const resources: TemplateResource[] = [];
  let inResources = false;
  let currentLogicalId = '';
  let currentType = '';
  let currentPropertyLines: string[] = [];
  let hasRetain = false;
  let inProperties = false;

  const saveResource = () => {
    if (currentLogicalId && currentType && hasRetain) {
      resources.push({
        logicalId: currentLogicalId,
        type: currentType,
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
    const resourceMatch = line.match(/^  ([A-Za-z]\w+):$/);
    if (resourceMatch) {
      saveResource();
      currentLogicalId = resourceMatch[1];
      currentType = '';
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

  return { resources, parameters };
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

async function main() {
  const { values } = parseArgs({
    options: {
      environment: { type: 'string' },
      template: { type: 'string', default: resolve(PROJECT_ROOT, 'template.yaml') },
      output: { type: 'string', default: 'resources-to-import.json' },
      region: { type: 'string', default: 'eu-west-2' },
      'account-id': { type: 'string' },
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

  const { resources, parameters } = parseTemplate(values.template!);
  parameters['Environment'] = values.environment;

  console.log(`Parsed template: ${values.template}`);
  console.log(`Environment: ${values.environment}`);
  console.log(`Found ${resources.length} resources with DeletionPolicy: Retain\n`);

  const resourcesToImport: ResourceToImport[] = [];
  const needsManualLookup: { logicalId: string; type: string; reason: string }[] = [];

  for (const resource of resources) {
    const config = RESOURCE_TYPE_CONFIG[resource.type];
    if (!config) {
      needsManualLookup.push({
        logicalId: resource.logicalId,
        type: resource.type,
        reason: 'unsupported resource type',
      });
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
  console.log(`Generated ${values.output} with ${resourcesToImport.length} resources\n`);

  if (needsManualLookup.length > 0) {
    console.log(`${needsManualLookup.length} resources need manual lookup:`);
    for (const r of needsManualLookup) {
      console.log(`  - ${r.logicalId} (${r.type}): ${r.reason}`);
    }
    console.log('\nFor AWS-generated IDs, use:');
    console.log('  aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*dap*" --query "Vpcs[].VpcId"');
    console.log('  aws ec2 describe-subnets --filters "Name=tag:Name,Values=*dap*" --query "Subnets[].SubnetId"');
    console.log('  aws kms list-aliases --query "Aliases[?contains(AliasName,\'dap\')]"');
  }

  console.log('\nTo create the import change set:');
  console.log(`  aws cloudformation create-change-set \\`);
  console.log(`    --stack-name STACK_NAME \\`);
  console.log(`    --change-set-name ImportChangeSet \\`);
  console.log(`    --change-set-type IMPORT \\`);
  console.log(`    --template-body file://template.yaml \\`);
  console.log(`    --resources-to-import file://${values.output} \\`);
  console.log(`    --parameters ParameterKey=Environment,ParameterValue=${values.environment} \\`);
  console.log(`    --region ${values.region}`);
}

main();
