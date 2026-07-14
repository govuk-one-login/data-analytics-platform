import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';

vi.mock('fs', async importOriginal => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readdirSync: vi.fn(() => ['raw_to_stage_etl_modules-0.1.0-py3-none-any.whl', 'raw_to_stage_process_glue_job.py']),
    readFileSync: vi.fn(() => Buffer.from('file-content')),
  };
});

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

test('Create event uploads all assets to S3', async () => {
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

test('Update event uploads all assets to S3', async () => {
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

test('Delete event does not upload anything', async () => {
  const { handler } = await import('./handler');

  await handler(createEvent('Delete'));

  const calls = mockS3Client.commandCalls(PutObjectCommand);
  expect(calls).toHaveLength(0);

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('"Status":"SUCCESS"'),
    }),
  );
});

test('S3 upload failure sends FAILED response', async () => {
  mockS3Client.on(PutObjectCommand).rejects(new Error('Access Denied'));
  const { handler } = await import('./handler');

  await handler(createEvent('Create'));

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('"Status":"FAILED"'),
    }),
  );
  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('Access Denied'),
    }),
  );
});

test('missing DESTINATION_BUCKET sends FAILED response', async () => {
  delete process.env.DESTINATION_BUCKET;
  mockS3Client.on(PutObjectCommand).resolves({});

  const { handler } = await import('./handler');
  await handler(createEvent('Create'));

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('"Status":"FAILED"'),
    }),
  );
  expect(global.fetch).toHaveBeenCalledWith(
    'https://cloudformation-response.example.com',
    expect.objectContaining({
      body: expect.stringContaining('DESTINATION_BUCKET'),
    }),
  );

  process.env.DESTINATION_BUCKET = 'dev-dap-elt-metadata';
});
