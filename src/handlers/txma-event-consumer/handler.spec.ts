import { handler, logger } from './handler';
import { mockLambdaContext, mockSQSEvent } from '../../shared/utils/test-utils';
import { FirehoseClient } from '@aws-sdk/client-firehose';
import { mockClient } from 'aws-sdk-client-mock';
const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

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
  expect(loggerErrorSpy).toHaveBeenCalledWith('Invalid audit event', {
    componentId: 'UNKNOWN',
    eventId: 'test-id',
    errors: ['Timestamp is larger than expected value'],
  });
});

test('event with multiple validation errors', async () => {
  mockFirehoseClient.resolves({});

  const validEvent = JSON.stringify({
    event_name: 11111,
    timestamp: 123456789101112,
    event_id: 'test-id',
  });
  const sqsEvent = mockSQSEvent(validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(0);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Invalid audit event', {
    componentId: 'UNKNOWN',
    eventId: 'test-id',
    errors: ['Event name is missing from audit event or is invalid', 'Timestamp is larger than expected value'],
  });
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
  expect(loggerErrorSpy).toHaveBeenCalledWith("Error delivering batch data to DAP's Kinesis Firehose:", {
    error: expect.any(Error),
  });
});

test('multiple valid events, one invalid event', async () => {
  mockFirehoseClient.resolves({});

  const validEvent = JSON.stringify({
    event_name: 'AUTH_AUTH_CODE_ISSUED',
    timestamp: 1234567890,
    event_id: 'test-id',
    component_id: 'test-component-id',
  });

  const invalidEvent = JSON.stringify({
    event_name: 124,
    timestamp: 1234567890,
    event_id: 'test-id',
    component_id: 'test-component-id',
  });

  const sqsEvent = mockSQSEvent(validEvent, validEvent, invalidEvent, validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Invalid audit event', {
    componentId: 'test-component-id',
    eventId: 'test-id',
    errors: ['Event name is missing from audit event or is invalid'],
  });
});

test('firehose error', async () => {
  mockFirehoseClient.rejects();

  const validEvent = JSON.stringify({ event_name: 'test', timestamp: 1234567890, event_id: 'test-id' });
  const sqsEvent = mockSQSEvent(validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  expect(response.batchItemFailures).toHaveLength(1);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
  expect(loggerErrorSpy).toHaveBeenCalledWith("Error delivering batch data to DAP's Kinesis Firehose:", {
    error: expect.any(Error),
  });
});

test('batch error handling', async () => {
  mockFirehoseClient.rejects();

  const validEvent = JSON.stringify({ event_name: 'test', timestamp: 1234567890, event_id: 'test-id' });
  const sqsEvent = mockSQSEvent(validEvent, validEvent, 'null', validEvent);
  const response = await handler(sqsEvent, mockLambdaContext);

  // All 4 records should fail: 3 valid ones fail due to Firehose error, 1 fails due to invalid JSON
  expect(response.batchItemFailures).toHaveLength(4);
  expect(mockFirehoseClient.calls()).toHaveLength(1);
  expect(loggerErrorSpy).toHaveBeenCalledWith("Error delivering batch data to DAP's Kinesis Firehose:", {
    error: expect.any(Error),
  });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Error processing record', {
    error: expect.any(TypeError),
  });
});
