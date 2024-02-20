import { handler, logger } from './handler';
import { SQSClient } from '@aws-sdk/client-sqs';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

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
