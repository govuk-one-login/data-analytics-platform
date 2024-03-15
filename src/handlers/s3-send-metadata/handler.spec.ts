import { handler } from './handler';
import { mockClient } from 'aws-sdk-client-mock';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { getTestResource } from '../../shared/utils/test-utils';
import type { S3Event } from 'aws-lambda';

const mockSQSClient = mockClient(SQSClient);

const METADATA_QUEUE_URL = 'https://sqs.eu-west-2.amazonaws.com/012345678912/dev-dap-ref-data-processing.fifo';

const S3_BUCKET_NAME = 'dev-dap-staging-reference-data-sets';

const S3_KEY =
  'reference-data/data_analytics/benefits_dashboard/20240312/age_missing_online_id_verification_2024-03-12_16-23-58.csv';

let TEST_EVENT: S3Event;

beforeAll(async () => {
  TEST_EVENT = JSON.parse(await getTestResource('s3-object-creation-notification.json'));
  TEST_EVENT.Records[0].s3.bucket.name = S3_BUCKET_NAME;
  TEST_EVENT.Records[0].s3.object.key = S3_KEY;
});

beforeEach(() => {
  mockSQSClient.reset();
  mockSQSClient.callsFake(input => {
    throw new Error(`Unexpected SQS request - ${JSON.stringify(input)}`);
  });

  process.env.METADATA_QUEUE_URL = METADATA_QUEUE_URL;
});

test('missing queue url', async () => {
  process.env.METADATA_QUEUE_URL = '';

  await expect(handler(TEST_EVENT)).rejects.toThrow('METADATA_QUEUE_URL is not defined in this environment');

  expect(mockSQSClient.calls()).toHaveLength(0);
});

test('bad input events', async () => {
  mockSQSClient.resolves({});

  await expect(handler(null as unknown as S3Event)).rejects.toThrow('Missing event or records');
  await expect(handler(undefined as unknown as S3Event)).rejects.toThrow('Missing event or records');
  await expect(handler({} as unknown as S3Event)).rejects.toThrow('Missing event or records');
  await expect(handler({ Records: null } as unknown as S3Event)).rejects.toThrow('Missing event or records');
  await expect(handler({ Records: undefined } as unknown as S3Event)).rejects.toThrow('Missing event or records');

  expect(mockSQSClient.calls()).toHaveLength(0);
});

test('success', async () => {
  // test indirectly by only resolving for the expected SendMessageCommand
  mockSQSClient
    .on(SendMessageCommand, {
      QueueUrl: METADATA_QUEUE_URL,
      MessageGroupId: 'age_missing_online_id_verification',
      MessageDeduplicationId: 'age_missing_online_id_verification_2024-03-12_16-23-58',
      MessageBody: JSON.stringify({
        bucket: S3_BUCKET_NAME,
        file_path: S3_KEY,
      }),
    })
    .resolvesOnce({});

  await handler(TEST_EVENT);

  expect(mockSQSClient.calls()).toHaveLength(1);
});
