import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import { ERROR_CODES } from './error-codes';

vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    readdirSync: vi.fn(() => ['raw_to_stage_etl_modules-0.1.0-py3-none-any.whl', 'raw_to_stage_process_glue_job.py']),
    readFileSync: vi.fn(() => Buffer.from('file-content')),
  };
});

vi.mock('../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockS3Client = mockClient(S3Client);

const createEvent = (requestType: 'Create' | 'Update' | 'Delete'): CloudFormationCustomResourceEvent =>
  ({
    RequestType: requestType,
    ServiceToken: 'arn:aws:lambda:eu-west-2:123456789012:function:test',
    ResponseURL: 'https://cloudformation-response.example.com',
    StackId: 'arn:aws:cloudformation:eu-west-2:123456789012:stack/test/guid',
    RequestId: 'test-request-id',
    ResourceType: 'Custom::CopyRawToStageCode',
    LogicalResourceId: 'CopyRawToStageCodeCustomResource',
    ResourceProperties: {
      ServiceToken: 'arn:aws:lambda:eu-west-2:123456789012:function:test',
      BuildHash: 'abc123',
    },
  }) as unknown as CloudFormationCustomResourceEvent;

beforeAll(() => {
  process.env.LAMBDA_TASK_ROOT = '/var/task';
  process.env.DESTINATION_BUCKET = 'dev-dap-elt-metadata';
  process.env.DESTINATION_PREFIX = 'txma/raw_to_stage/';
});

afterAll(() => {
  delete process.env.LAMBDA_TASK_ROOT;
  delete process.env.DESTINATION_BUCKET;
  delete process.env.DESTINATION_PREFIX;
});

beforeEach(() => {
  mockS3Client.reset();
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
});

test('Create event uploads all assets to S3 and sends SUCCESS response', async () => {
  mockS3Client.on(PutObjectCommand).resolves({});
  const { handler } = await import('./handler');

  await handler(createEvent('Create'));

  const calls = mockS3Client.commandCalls(PutObjectCommand);
  expect(calls).toHaveLength(2);

  const keys = calls.map(c => c.args[0].input.Key).sort();
  expect(keys).toEqual([
    'txma/raw_to_stage/raw_to_stage_etl_modules-0.1.0-py3-none-any.whl',
    'txma/raw_to_stage/raw_to_stage_process_glue_job.py',
  ]);

  for (const call of calls) {
    expect(call.args[0].input.Bucket).toBe('dev-dap-elt-metadata');
  }

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      method: 'PUT',
      body: expect.stringContaining('"Status":"SUCCESS"'),
    }),
  );
});

test('Update event uploads all assets to S3 and sends SUCCESS response', async () => {
  mockS3Client.on(PutObjectCommand).resolves({});
  const { handler } = await import('./handler');

  await handler(createEvent('Update'));

  const calls = mockS3Client.commandCalls(PutObjectCommand);
  expect(calls).toHaveLength(2);

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('"Status":"SUCCESS"'),
    }),
  );
});

test('Delete event does not upload anything and sends SUCCESS response', async () => {
  const { handler } = await import('./handler');

  await handler(createEvent('Delete'));

  expect(mockS3Client.commandCalls(PutObjectCommand)).toHaveLength(0);

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('"Status":"SUCCESS"'),
    }),
  );
});

test('S3 upload failure logs error with DAP002 code and sends FAILED response', async () => {
  mockS3Client.on(PutObjectCommand).rejects(new Error('Access Denied'));
  const { handler } = await import('./handler');
  const { logger } = await import('../../shared/logger');

  await handler(createEvent('Create'));

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('"Status":"FAILED"'),
    }),
  );

  expect(logger.error).toHaveBeenCalledWith(
    'Failed to upload asset to S3',
    expect.objectContaining({
      error: expect.objectContaining({ code: ERROR_CODES.S3_UPLOAD_FAILED }),
    }),
  );
});

test('missing DESTINATION_BUCKET logs error with DAP001 code and sends FAILED response', async () => {
  delete process.env.DESTINATION_BUCKET;
  const { handler } = await import('./handler');
  const { logger } = await import('../../shared/logger');

  await handler(createEvent('Create'));

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('"Status":"FAILED"'),
    }),
  );

  expect(logger.error).toHaveBeenCalledWith(
    'Missing required environment variable',
    expect.objectContaining({
      error: expect.objectContaining({ code: ERROR_CODES.MISSING_DESTINATION_BUCKET }),
    }),
  );

  process.env.DESTINATION_BUCKET = 'dev-dap-elt-metadata';
});

test('DESTINATION_PREFIX defaults to txma/raw_to_stage/ when env var not set', async () => {
  // Unit Test - covers the `process.env.DESTINATION_PREFIX ?? 'txma/raw_to_stage/'` false branch (line 37)
  delete process.env.DESTINATION_PREFIX;
  mockS3Client.on(PutObjectCommand).resolves({});
  const { handler } = await import('./handler');

  await handler(createEvent('Create'));

  const calls = mockS3Client.commandCalls(PutObjectCommand);
  expect(calls[0]!.args[0].input.Key).toMatch(/^txma\/raw_to_stage\//u);

  process.env.DESTINATION_PREFIX = 'txma/raw_to_stage/';
});

test('ASSETS_DIR uses import.meta.dirname fallback when LAMBDA_TASK_ROOT not set', async () => {
  // Unit Test - covers the `process.env.LAMBDA_TASK_ROOT ?? import.meta.dirname` false branch (line 9)
  delete process.env.LAMBDA_TASK_ROOT;
  mockS3Client.on(PutObjectCommand).resolves({});
  vi.resetModules();
  const { handler } = await import('./handler');

  // handler should still complete (assets dir may not exist but fetch is mocked)
  await handler(createEvent('Delete'));

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({ method: 'PUT' }),
  );

  process.env.LAMBDA_TASK_ROOT = '/var/task';
});
