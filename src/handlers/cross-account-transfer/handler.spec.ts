import type { Event } from './handler';
import { handler, logger } from './handler';
import { SQSClient } from '@aws-sdk/client-sqs';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import fs from 'node:fs';

const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
jest.spyOn(logger, 'error').mockImplementation(() => undefined);

const mockSQSClient = mockClient(SQSClient);
const mockS3Client = mockClient(S3Client);

let TEST_EVENT: Event;

beforeAll(async () => {
  // Mocked test event
  TEST_EVENT = {
    config: [
      {
        event_name: 'test_event',
        start_date: '2024-01-01',
        end_date: '2024-01-01',
      },
    ],
    raw_bucket: 'test_bucket',
    queue_url: 'test_queue_url',
  };
});

beforeEach(() => {
  mockSQSClient.reset();
  mockS3Client.reset();
  loggerSpy.mockReset();
});

test('should handle errors gracefully', async () => {
  // Mock S3 error
  mockS3Client.on(ListObjectsV2Command).rejects('S3 Error');

  // Call the Lambda handler
  await expect(handler(TEST_EVENT)).resolves.toStrictEqual({
    statusCode: 500,
    body: JSON.stringify('Error sending messages to SQS'),
  });

  // Assertions
  expect(mockS3Client.calls()).toHaveLength(1);
  expect(mockSQSClient.calls()).toHaveLength(0);
});

test('success', async () => {
  const contents = Array(32)
    .fill(0)
    .map(() => ({ Key: `file.json` }));
  mockS3Client.callsFake(input => {
    // ListObjectsV2Command
    if (input.Prefix !== undefined) {
      return Promise.resolve({ Contents: contents });
      // GetObjectCommand
    } else if (input.Key !== undefined) {
      return Promise.resolve({
        Body: fs.createReadStream('src/test-resources/raw-event.gz'),
        ContentEncoding: 'gzip',
      });
    }
  });

  await expect(handler(TEST_EVENT)).resolves.toStrictEqual({
    statusCode: 200,
    body: JSON.stringify('Messages sent to SQS successfully!'),
  });

  expect(mockS3Client.calls()).toHaveLength(33); // 1 to list objects and 32 (one for each of the contents)
  expect(mockSQSClient.calls()).toHaveLength(4); // 3 batches of ten and 1 of two
  expect(mockSQSClient.calls()[0].firstArg.input.Entries).toHaveLength(10);
  expect(mockSQSClient.calls()[1].firstArg.input.Entries).toHaveLength(10);
  expect(mockSQSClient.calls()[2].firstArg.input.Entries).toHaveLength(10);
  expect(mockSQSClient.calls()[3].firstArg.input.Entries).toHaveLength(2);
});
