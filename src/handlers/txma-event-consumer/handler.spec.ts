import { handler, logger } from './handler';
import { mockSQSEvent } from '../../shared/utils/test-utils';
import { FirehoseClient } from '@aws-sdk/client-firehose';
import { mockClient } from 'aws-sdk-client-mock';

const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
jest.spyOn(logger, 'error').mockImplementation(() => undefined);

const mockFirehoseClient = mockClient(FirehoseClient);

beforeEach(() => {
  mockFirehoseClient.reset();
  loggerSpy.mockReset();
  process.env.FIREHOSE_STREAM_NAME = 'stream-name';
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

  const sqsEvent = mockSQSEvent('{}');
  const response = await handler(sqsEvent);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
});

test('batch error handling', async () => {
  mockFirehoseClient.rejectsOnce().resolves({});

  const sqsEvent = mockSQSEvent('{}', '{}', null, '{}');
  const response = await handler(sqsEvent);

  // 1 and 3 should have failed. 1 because of the mock client rejecting on the first call and 3 as the body is null
  expect(response.batchItemFailures).toHaveLength(2);
  expect(response.batchItemFailures.map(failure => failure.itemIdentifier)).toEqual(expect.arrayContaining(['1', '3']));
  expect(mockFirehoseClient.calls()).toHaveLength(3);
});

test('logs in dev', async () => {
  mockFirehoseClient.resolves({});
  process.env.ENVIRONMENT = 'dev';

  const sqsEvent = mockSQSEvent('{"hello":"world"}');
  const response = await handler(sqsEvent);

  expect(response.batchItemFailures).toHaveLength(0);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
  expect(loggerSpy).toHaveBeenCalledTimes(1);
  expect(loggerSpy).toHaveBeenCalledWith('Received record with message id 1 with event "{\\"hello\\":\\"world\\"}"');
});

test('does not log in build', async () => {
  mockFirehoseClient.resolves({});
  process.env.ENVIRONMENT = 'build';

  const sqsEvent = mockSQSEvent('{"hello":"world"}');
  const response = await handler(sqsEvent);

  expect(response.batchItemFailures).toHaveLength(0);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
  expect(loggerSpy).toHaveBeenCalledTimes(0);
});
