/**
 * Generate an import-only CloudFormation template containing only resources
 * with DeletionPolicy: Retain that match the target environment's conditions.
 *
 * This is needed because CloudFormation IMPORT change sets require that the template
 * contains ONLY the resources being imported — no other resources can be present.
 *
 * Usage:
 *   npx tsx scripts/recovery/dev/generate-import-template.ts --environment ENV --input TEMPLATE --output FILE
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../..');

/** Evaluate whether a condition is true for a given environment. */
function evaluateCondition(conditionName: string, conditions: Record<string, string[]>, environment: string): boolean {
  const validEnvironments = conditions[conditionName];
  if (!validEnvironments) return true; // Unknown condition — include by default
  return validEnvironments.includes(environment);
}

function parseConditions(lines: string[]): Record<string, string[]> {
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
      const condMatch = line.match(/^  ([A-Za-z]\w+):$/);
      if (condMatch) {
        if (currentCondition && conditionEnvironments.length > 0) {
          conditions[currentCondition] = conditionEnvironments;
        }
        currentCondition = condMatch[1];
        conditionEnvironments = [];
        continue;
      }
      const envMatch = line.match(/^\s+- (dev|build|staging|integration|production|production-preview)$/);
      if (envMatch && currentCondition) {
        conditionEnvironments.push(envMatch[1]);
      }
      const subCondMatch = line.match(/^\s+- Condition:\s*(\w+)$/);
      if (subCondMatch && conditions[subCondMatch[1]]) {
        conditionEnvironments.push(...conditions[subCondMatch[1]]);
      }
    }
  }
  if (currentCondition && conditionEnvironments.length > 0) {
    conditions[currentCondition] = conditionEnvironments;
  }

  return conditions;
}

interface ResourceBlock {
  logicalId: string;
  lines: string[];
  hasRetain: boolean;
  condition?: string;
}

function extractResourceBlocks(lines: string[]): ResourceBlock[] {
  const blocks: ResourceBlock[] = [];
  let inResources = false;
  let currentBlock: string[] = [];
  let currentLogicalId = '';
  let hasRetain = false;
  let condition: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === 'Resources:') {
      inResources = true;
      continue;
    }
    if (!inResources) continue;

    // New resource (2-space indent)
    const resourceMatch = line.match(/^  ([A-Za-z]\w+):$/);
    if (resourceMatch) {
      if (currentLogicalId) {
        blocks.push({ logicalId: currentLogicalId, lines: currentBlock, hasRetain, condition });
      }
      currentLogicalId = resourceMatch[1];
      currentBlock = [line];
      hasRetain = false;
      condition = undefined;
      continue;
    }

    // End of Resources section
    if (/^[A-Za-z]/.test(line) && !line.startsWith(' ')) {
      if (currentLogicalId) {
        blocks.push({ logicalId: currentLogicalId, lines: currentBlock, hasRetain, condition });
      }
      break;
    }

    if (currentLogicalId) {
      currentBlock.push(line);
      if (line.match(/^\s{4}DeletionPolicy:\s*Retain/)) {
        hasRetain = true;
      }
      const condMatch = line.match(/^\s{4}Condition:\s*(\w+)/);
      if (condMatch) {
        condition = condMatch[1];
      }
    }
  }

  return blocks;
}

function main() {
  const { values } = parseArgs({
    options: {
      environment: { type: 'string' },
      input: { type: 'string', default: resolve(PROJECT_ROOT, 'packaged-template.yaml') },
      output: { type: 'string', default: resolve(PROJECT_ROOT, 'import-template.yaml') },
      'resources-to-import': { type: 'string', default: resolve(PROJECT_ROOT, 'resources-to-import.json') },
    },
  });

  if (!values.environment) {
    console.error(
      'Usage: npx tsx scripts/generate-import-template.ts --environment ENV [--input FILE] [--output FILE] [--resources-to-import FILE]',
    );
    process.exit(1);
  }

  const content = readFileSync(values.input!, 'utf-8');
  const lines = content.split('\n');

  // Load the resources-to-import JSON to know which logical IDs we can actually import
  const resourcesToImport: { LogicalResourceId: string }[] = JSON.parse(
    readFileSync(values['resources-to-import']!, 'utf-8'),
  );
  const importableLogicalIds = new Set(resourcesToImport.map(r => r.LogicalResourceId));

  const conditions = parseConditions(lines);
  const resourceBlocks = extractResourceBlocks(lines);

  // Filter to only retained resources that match the environment AND are in the import list
  const retainedBlocks = resourceBlocks.filter(block => {
    if (!block.hasRetain) return false;
    if (block.condition && !evaluateCondition(block.condition, conditions, values.environment!)) return false;
    if (!importableLogicalIds.has(block.logicalId)) return false;
    return true;
  });

  const retainedLogicalIds = new Set(retainedBlocks.map(b => b.logicalId));

  // Identify which retained resources have references to non-retained resources
  const allTemplateLogicalIds = new Set(resourceBlocks.map(b => b.logicalId));
  const nonRetainedIds = new Set([...allTemplateLogicalIds].filter(id => !retainedLogicalIds.has(id)));

  const hasExternalRef = (block: ResourceBlock): boolean => {
    const text = block.lines.join('\n');
    for (const id of nonRetainedIds) {
      if (text.includes(id)) return true;
    }
    if (text.includes('{{resolve:')) return true;
    return false;
  };

  // First pass: identify resources with external references
  const externalRefIds = new Set(retainedBlocks.filter(b => hasExternalRef(b)).map(b => b.logicalId));

  // Second pass: if any retained resource references one of the external-ref resources,
  // that external-ref resource must stay in Step 1 (it's a dependency of a clean resource).
  // Only defer resources that are NOT depended on by other retained resources.
  const isReferencedByRetained = (id: string): boolean => {
    for (const block of retainedBlocks) {
      if (block.logicalId === id) continue;
      if (!externalRefIds.has(block.logicalId)) {
        // This is a clean resource — check if it references the given id
        if (block.lines.join('\n').includes(id)) return true;
      }
    }
    return false;
  };

  // Only defer resources that have external refs AND are not depended on by clean resources
  const deferredIds = new Set([...externalRefIds].filter(id => !isReferencedByRetained(id)));

  // Final filter: only include resources that are actually in the resources-to-import JSON
  // (some resources can't be imported due to unsupported types or unresolved identifiers)
  const importableFromJson = new Set(resourcesToImport.map(r => r.LogicalResourceId));

  const cleanBlocks = retainedBlocks.filter(b => !deferredIds.has(b.logicalId) && importableFromJson.has(b.logicalId));
  const deferredBlocks = retainedBlocks.filter(
    b => deferredIds.has(b.logicalId) && importableFromJson.has(b.logicalId),
  );

  // Extract everything before Resources: section (header, parameters, conditions, etc.)
  const resourcesLineIndex = lines.indexOf('Resources:');
  const header = lines.slice(0, resourcesLineIndex + 1).join('\n');

  // Build the Step 1 import template — only clean resources (no dangling references)
  let resourceSection = cleanBlocks.map(block => block.lines.join('\n')).join('\n\n');

  // For clean resources that have external refs (kept in Step 1 because others depend on them),
  // replace references to non-retained resources with placeholder values
  // Also replace references to retained resources that aren't in the import template
  const cleanLogicalIds = new Set(cleanBlocks.map(b => b.logicalId));
  const idsNotInTemplate = new Set([...allTemplateLogicalIds].filter(id => !cleanLogicalIds.has(id)));
  for (const id of idsNotInTemplate) {
    resourceSection = resourceSection.replaceAll(new RegExp(`!GetAtt ${id}\\.\\w+`, 'g'), "'placeholder'");
    resourceSection = resourceSection.replaceAll(new RegExp(`!Ref ${id}\\b`, 'g'), "'placeholder'");
    resourceSection = resourceSection.replaceAll(
      new RegExp(`Fn::GetAtt:\\s*\\[${id},\\s*\\w+\\]`, 'g'),
      "'placeholder'",
    );
    resourceSection = resourceSection.replaceAll(
      new RegExp(`Fn::GetAtt:\\n(\\s+)- ${id}\\n\\s+- \\w+`, 'g'),
      "'placeholder'",
    );
    resourceSection = resourceSection.replaceAll(new RegExp(`Ref:\\s*${id}\\b`, 'g'), "'placeholder'");
    resourceSection = resourceSection.replaceAll(
      new RegExp(`- Fn::GetAtt:\\n(\\s+)- ${id}\\n\\s+- \\w+`, 'g'),
      "- 'placeholder'",
    );
  }

  const outputContent = header + '\n' + resourceSection + '\n';
  let finalContent = outputContent.replace(/^Transform:.*\n/m, '');
  // Remove Globals and Outputs sections
  const stripSection = (text: string, sectionName: string): string => {
    const lines = text.split('\n');
    const result: string[] = [];
    let inSection = false;
    for (const line of lines) {
      if (line === sectionName + ':') {
        inSection = true;
        continue;
      }
      if (inSection && line.length > 0 && /^[A-Za-z]/.test(line)) {
        inSection = false;
      }
      if (!inSection) {
        result.push(line);
      }
    }
    return result.join('\n');
  };
  finalContent = stripSection(finalContent, 'Globals');
  finalContent = stripSection(finalContent, 'Outputs');

  writeFileSync(values.output!, finalContent);

  // Write the list of deferred resource logical IDs for Step 3
  const deferredFile = values.output!.replace('.yaml', '-deferred.json');
  const deferredLogicalIds = deferredBlocks.map(b => b.logicalId);
  writeFileSync(deferredFile, JSON.stringify(deferredLogicalIds, null, 2));

  // Also write a filtered resources-to-import that only includes resources in the import template
  const cleanIds = new Set(cleanBlocks.map(b => b.logicalId));
  const cleanResourcesToImport = resourcesToImport.filter(r => cleanIds.has(r.LogicalResourceId));

  // Verify all template resources are in the import list — if any are missing, it will fail
  const importIds = new Set(cleanResourcesToImport.map(r => r.LogicalResourceId));
  const missingFromImport = cleanBlocks.filter(b => !importIds.has(b.logicalId));
  if (missingFromImport.length > 0) {
    console.warn(
      `WARNING: ${missingFromImport.length} resources in import template but not in resources-to-import JSON:`,
    );
    for (const b of missingFromImport) {
      console.warn(`  - ${b.logicalId} (will be excluded from template)`);
    }
    // Remove these from the template — they can't be imported without identifiers
    const finalCleanBlocks = cleanBlocks.filter(b => importIds.has(b.logicalId));
    const resourceSection2 = finalCleanBlocks.map(block => block.lines.join('\n')).join('\n\n');
    // Re-apply placeholder replacement
    let fixedSection = resourceSection2;
    const finalCleanIds = new Set(finalCleanBlocks.map(b => b.logicalId));
    for (const id of [...nonRetainedIds, ...missingFromImport.map(b => b.logicalId)]) {
      const idStr = typeof id === 'string' ? id : (id as ResourceBlock).logicalId;
      if (finalCleanIds.has(idStr)) continue;
      fixedSection = fixedSection.replaceAll(new RegExp(`!GetAtt ${idStr}\\.\\w+`, 'g'), "'placeholder'");
      fixedSection = fixedSection.replaceAll(new RegExp(`!Ref ${idStr}\\b`, 'g'), "'placeholder'");
      fixedSection = fixedSection.replaceAll(
        new RegExp(`Fn::GetAtt:\\s*\\[${idStr},\\s*\\w+\\]`, 'g'),
        "'placeholder'",
      );
      fixedSection = fixedSection.replaceAll(
        new RegExp(`Fn::GetAtt:\\n(\\s+)- ${idStr}\\n\\s+- \\w+`, 'g'),
        "'placeholder'",
      );
      fixedSection = fixedSection.replaceAll(new RegExp(`Ref:\\s*${idStr}\\b`, 'g'), "'placeholder'");
      fixedSection = fixedSection.replaceAll(
        new RegExp(`- Fn::GetAtt:\\n(\\s+)- ${idStr}\\n\\s+- \\w+`, 'g'),
        "- 'placeholder'",
      );
    }
    const fixedContent = header + '\n' + fixedSection + '\n';
    let fixedFinal = fixedContent.replace(/^Transform:.*\n/m, '');
    fixedFinal = stripSection(fixedFinal, 'Globals');
    fixedFinal = stripSection(fixedFinal, 'Outputs');
    writeFileSync(values.output!, fixedFinal);
  }
  const cleanImportFile = values['resources-to-import']!.replace('.json', '-clean.json');
  writeFileSync(cleanImportFile, JSON.stringify(cleanResourcesToImport, null, 2));

  console.log(`Input template: ${values.input}`);
  console.log(`Environment: ${values.environment}`);
  console.log(`Total resources: ${resourceBlocks.length}`);
  console.log(`Retained resources (matching environment): ${retainedBlocks.length}`);
  console.log(`  Clean (Step 1 import): ${cleanBlocks.length}`);
  console.log(`  Deferred (Step 3 import after sam deploy): ${deferredBlocks.length}`);
  if (deferredBlocks.length > 0) {
    console.log(`  Deferred resources: ${deferredLogicalIds.join(', ')}`);
  }
  console.log(`Generated import template: ${values.output}`);
  console.log(`Generated clean resources-to-import: ${cleanImportFile}`);
  console.log(`Generated deferred resources list: ${deferredFile}`);
}

main();
