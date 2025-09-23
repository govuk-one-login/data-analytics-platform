import { handler, logger } from './handler';
import { mockLambdaContext, mockSQSEvent } from '../../../common/utilities/test-utils';
import { FirehoseClient } from '@aws-sdk/client-firehose';
import { mockClient } from 'aws-sdk-client-mock';

const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
const loggerDebugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => undefined);

const mockFirehoseClient = mockClient(FirehoseClient);

beforeEach(() => {
  mockFirehoseClient.reset();
  loggerInfoSpy.mockReset();
  loggerErrorSpy.mockReset();
  process.env.FIREHOSE_STREAM_NAME = 'stream-name';
});

test('valid event', async () => {
  mockFirehoseClient.resolves({});

  const validEvent = JSON.stringify({
    event_name: 'AUTH_AUTH_CODE_ISSUED',
    timestamp: 1234567890,
    event_id: 'test-id',
    component_id: 'test-component-id',
  });
  const sqsEvent = mockSQSEvent(validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  expect(response.batchItemFailures).toHaveLength(0);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
  expect(loggerDebugSpy).toHaveBeenCalledWith('Successfully processed audit event', {
    componentId: 'test-component-id',
    eventId: 'test-id',
  });
});

test('event with invalid timestamp', async () => {
  mockFirehoseClient.resolves({});

  const validEvent = JSON.stringify({
    event_name: 'AUTH_AUTH_CODE_ISSUED',
    timestamp: 123456789101112,
    event_id: 'test-id',
  });
  const sqsEvent = mockSQSEvent(validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(0);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Invalid audit event', { componentId: 'UNKNOWN', eventId: 'test-id' });
});

test('invalid events', async () => {
  mockFirehoseClient.resolves({});

  const sqsEvent = mockSQSEvent('null', 'undefined', 'false', 'true', '{}');
  const response = await handler(sqsEvent, mockLambdaContext);

  expect(response.batchItemFailures).toHaveLength(5);
  expect(mockFirehoseClient.calls()).toHaveLength(0);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(5);
});

test('missing stream name', async () => {
  mockFirehoseClient.resolves({});
  process.env.FIREHOSE_STREAM_NAME = '';

  const validEvent = JSON.stringify({ event_name: 'test', timestamp: 1234567890, event_id: 'test-id' });
  const sqsEvent = mockSQSEvent(validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(0);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Error processing record', { error: expect.any(Error) });
});

test('firehose error', async () => {
  mockFirehoseClient.rejects();

  const validEvent = JSON.stringify({ event_name: 'test', timestamp: 1234567890, event_id: 'test-id' });
  const sqsEvent = mockSQSEvent(validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
  expect(loggerErrorSpy).toHaveBeenCalledWith("Error delivering data to DAP's Kinesis Firehose:", {
    error: expect.any(Error),
  });
});

test('batch error handling', async () => {
  mockFirehoseClient.rejectsOnce().resolves({});

  const validEvent = JSON.stringify({ event_name: 'test', timestamp: 1234567890, event_id: 'test-id' });
  const sqsEvent = mockSQSEvent(validEvent, validEvent, 'null', validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  // 1 and 3 should have failed. 1 because of the mock client rejecting on the first call and 3 as the body is invalid JSON
  expect(response.batchItemFailures).toHaveLength(2);
  expect(response.batchItemFailures.map(failure => failure.itemIdentifier)).toEqual(expect.arrayContaining(['1', '3']));
  expect(mockFirehoseClient.calls()).toHaveLength(3);
  expect(loggerDebugSpy).toHaveBeenCalledWith('Successfully processed audit event', {
    componentId: 'UNKNOWN',
    eventId: 'test-id',
  });
  expect(loggerDebugSpy).toHaveBeenCalledWith('Successfully processed audit event', {
    componentId: 'UNKNOWN',
    eventId: 'test-id',
  });
  expect(loggerErrorSpy).toHaveBeenCalledWith("Error delivering data to DAP's Kinesis Firehose:", {
    error: expect.any(Error),
  });
});
