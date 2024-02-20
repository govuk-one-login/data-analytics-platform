import { handler } from './handler'; // Update the path to match your Lambda function file
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from 'aws-sdk-client-mock';

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
        end_date: '2024-01-01'
      }
    ],
    raw_bucket: 'test_bucket',
    queue_url: 'test_queue_url'
  };
});

beforeEach(() => {
  mockSQSClient.reset();
  mockS3Client.reset();
});

test('should send messages to SQS successfully', async () => {
  // Mock S3 response
  const s3ResponseMock = {
    Contents: [
      { Key: 'test_key_1' },
      { Key: 'test_key_2' }
      // Add more mock data as needed
    ]
  };
  mockS3Client.on(ListObjectsV2Command).resolves(s3ResponseMock);

  // Mock S3 object response
  const getObjectResponseMock = {
    Body: {
      pipe: jest.fn(),
      on: jest.fn()
    }
  };
  mockS3Client.on(GetObjectCommand).resolves(getObjectResponseMock);

  // Mock successful sending of messages to SQS
  mockSQSClient.on(SendMessageBatchCommand).resolves({});

  // Call the Lambda handler
  await expect(handler(TEST_EVENT)).resolves.toStrictEqual({ statusCode: 200, body: JSON.stringify('Messages sent to SQS successfully!') });

  // Assertions
  expect(mockS3Client.calls()).toHaveLength(2); // Adjust based on the number of expected calls to S3
  expect(mockSQSClient.calls()).toHaveLength(1); // Adjust based on the number of expected calls to SQS
});

test('should handle errors gracefully', async () => {
  // Mock S3 error
  mockS3Client.on(ListObjectsV2Command).rejects('S3 Error');

  // Call the Lambda handler
  await expect(handler(TEST_EVENT)).resolves.toStrictEqual({ statusCode: 500, body: JSON.stringify('Error sending messages to SQS') });

  // Assertions
  expect(mockS3Client.calls()).toHaveLength(1); // Adjust based on the number of expected calls to S3
  expect(mockSQSClient.calls()).toHaveLength(0); // Adjust based on the number of expected calls to SQS
});

