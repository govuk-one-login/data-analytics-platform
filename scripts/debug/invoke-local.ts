/**
 * Invokes a Lambda handler directly in Node.js (no Docker/SAM).
 * Usage: ts-node scripts/debug/invoke-local.ts <handlerName>
 * e.g.   ts-node scripts/debug/invoke-local.ts s3-send-metadata
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Context } from 'aws-lambda';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const handlerName = process.argv[2];
if (!handlerName) {
  console.error('Usage: invoke-local.ts <handlerName>');
  process.exit(1);
}

const debugDir = join(__dirname);
const rootDir = join(__dirname, '../..');

const envVars = JSON.parse(readFileSync(join(debugDir, 'env-vars.json'), 'utf-8')) as {
  Parameters: Record<string, string>;
};
Object.entries(envVars.Parameters).forEach(([k, v]) => {
  process.env[k] = v;
});

if (!process.env.AWS_PROFILE) {
  process.env.AWS_PROFILE = 'data-analytics-platform-dev';
}

process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'DEBUG';
process.env.POWERTOOLS_DEV = 'true';

const event = JSON.parse(readFileSync(join(debugDir, 'events', `${handlerName}.json`), 'utf-8')) as unknown;

const context: Context = {
  functionName: handlerName,
  functionVersion: '$LATEST',
  invokedFunctionArn: `arn:aws:lambda:eu-west-2:123456789012:function:${handlerName}`,
  memoryLimitInMB: '1536',
  awsRequestId: 'local-debug-request-id',
  logGroupName: `/aws/lambda/${handlerName}`,
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 30000,
  callbackWaitsForEmptyEventLoop: false,
} as Context;

const { handler } = (await import(join(rootDir, 'src/handlers', handlerName, 'handler'))) as {
  handler: (event: unknown, context: Context) => Promise<void>;
};

await handler(event, context)
  .then(() => console.log('Handler completed successfully'))
  .catch((err: Error) => {
    console.error('Handler failed:', err);
    process.exit(1);
  });
