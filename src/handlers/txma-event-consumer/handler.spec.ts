import { handler } from './handler';
import { mockSQSEvent } from '../../shared/utils/test-utils';
import { FirehoseClient } from '@aws-sdk/client-firehose';
import { mockClient } from 'aws-sdk-client-mock';
import { SQSClient } from '@aws-sdk/client-sqs';

jest.spyOn(console, 'log').mockImplementation(() => undefined);
jest.spyOn(console, 'error').mockImplementation(() => undefined);

const mockFirehoseClient = mockClient(FirehoseClient);
const mockSQSClient = mockClient(SQSClient);

beforeEach(() => {
  mockFirehoseClient.reset();
  mockSQSClient.reset();
  process.env.FIREHOSE_STREAM_NAME = 'stream-name';
  process.env.DEAD_LETTER_QUEUE_NAME = 'dlq-name';
});

test('valid event', async () => {
  mockFirehoseClient.resolves({});

  const sqsEvent = mockSQSEvent('{}');
  const response = await handler(sqsEvent);

  expect(response.batchItemFailures).toHaveLength(0);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
});

test('invalid events', async () => {
  mockFirehoseClient.resolves({});

  const sqsEvent = mockSQSEvent(null, undefined, false, true, {});
  const response = await handler(sqsEvent);

  expect(response.batchItemFailures).toHaveLength(5);
  expect(mockFirehoseClient.calls()).toHaveLength(0);
});

test('missing stream name', async () => {
  mockFirehoseClient.resolves({});
  process.env.FIREHOSE_STREAM_NAME = '';

  const sqsEvent = mockSQSEvent('{}');
  const response = await handler(sqsEvent);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(0);
});

test('firehose error', async () => {
  mockFirehoseClient.rejects();
  mockSQSClient.resolves({});

  const sqsEvent = mockSQSEvent('{}');
  const response = await handler(sqsEvent);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(3);
});

test('batch error handling', async () => {
  mockFirehoseClient.rejects().resolves({});

  const sqsEvent = mockSQSEvent('{}', '{}', null, '{}');
  const response = await handler(sqsEvent);
  console.warn(response);

  // 1 and 3 should have failed. 1 because of the mock client rejecting on the first call and 3 as the body is null
  expect(response.batchItemFailures).toHaveLength(1);
  expect(response.batchItemFailures.map(failure => failure.itemIdentifier)).toEqual(expect.arrayContaining(['3']));
  expect(mockFirehoseClient.calls()).toHaveLength(3);
});
