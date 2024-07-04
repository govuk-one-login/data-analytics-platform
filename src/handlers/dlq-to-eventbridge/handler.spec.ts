import { mockClient } from 'aws-sdk-client-mock';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { handler, logger } from './handler';
import type { S3Event, SQSEvent, SQSRecord } from 'aws-lambda';
import { getTestResource } from '../../shared/utils/test-utils';
import type { RedshiftGetMetadataEvent } from '../redshift-get-metadata/handler';
import type { RedshiftFileMetadata } from '../../shared/types/redshift-metadata';

const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

const mockEventbridgeClient = mockClient(EventBridgeClient);

const EVENTBRIDGE_ENTRY_BASE = {
  Source: 'reference-data-ingestion-pipeline',
  DetailType: 'ingestion-status: failure',
};

const sqsEvent = (...bodies: unknown[]): SQSEvent => {
  const records: SQSRecord[] = bodies.map(
    body =>
      ({
        messageId: Math.random().toString(36).substring(2),
        body: typeof body === 'string' ? body : JSON.stringify(body),
      }) as unknown as SQSRecord,
  );
  return { Records: records };
};

beforeEach(() => {
  loggerSpy.mockReset();
  mockEventbridgeClient.reset();
  mockEventbridgeClient.callsFake(input => {
    throw new Error(`Unexpected Eventbridge request - ${JSON.stringify(input)}`);
  });
});

test('process s3 event', async () => {
  const filepath = 's3e file path';
  const s3Event: S3Event = JSON.parse(await getTestResource('s3-object-creation-notification.json'));
  s3Event.Records[0].s3.object.key = filepath;

  mockEventbridgeClient
    .on(PutEventsCommand, { Entries: [{ ...EVENTBRIDGE_ENTRY_BASE, Detail: JSON.stringify({ filepath }) }] })
    .resolves({});

  const event = sqsEvent(s3Event);
  const batchResponse = await handler(event);
  expect(batchResponse.batchItemFailures).toHaveLength(0);

  expect(mockEventbridgeClient.calls()).toHaveLength(1);
});

test('process redshift get metadata event', async () => {
  const filepath = 'rgme file path';
  const redshiftFileMetadata: RedshiftFileMetadata = { bucket: 's3 bucket', file_path: filepath };
  const redshiftGetMetadataEvent: RedshiftGetMetadataEvent = { fileMetadata: JSON.stringify(redshiftFileMetadata) };

  mockEventbridgeClient
    .on(PutEventsCommand, { Entries: [{ ...EVENTBRIDGE_ENTRY_BASE, Detail: JSON.stringify({ filepath }) }] })
    .resolves({});

  const event = sqsEvent(redshiftGetMetadataEvent);
  const batchResponse = await handler(event);
  expect(batchResponse.batchItemFailures).toHaveLength(0);

  expect(mockEventbridgeClient.calls()).toHaveLength(1);
});

test('process redshift file metadata', async () => {
  const filepath = 'rfm file path';
  const redshiftFileMetadata: RedshiftFileMetadata = { bucket: 's3 bucket', file_path: filepath };

  mockEventbridgeClient
    .on(PutEventsCommand, { Entries: [{ ...EVENTBRIDGE_ENTRY_BASE, Detail: JSON.stringify({ filepath }) }] })
    .resolves({});

  const event = sqsEvent(redshiftFileMetadata);
  const batchResponse = await handler(event);
  expect(batchResponse.batchItemFailures).toHaveLength(0);

  expect(mockEventbridgeClient.calls()).toHaveLength(1);
});

test.each([
  {
    name: 'unknown',
    event: sqsEvent({ hello: 'world' }),
    expectedError: 'Could not parse input event as any of the expected event types',
  },
  {
    name: 'unparseable',
    event: sqsEvent('hello world'),
    expectedError: 'Unexpected token \'h\', "hello world" is not valid JSON',
  },
])('$name input event', async ({ event, expectedError }) => {
  const batchResponse = await handler(event);
  expect(batchResponse.batchItemFailures).toHaveLength(1);
  expect(batchResponse.batchItemFailures[0]).toEqual({ itemIdentifier: event.Records[0].messageId });

  expect(mockEventbridgeClient.calls()).toHaveLength(0);

  expect(loggerSpy).toHaveBeenCalledTimes(1);
  expect(loggerSpy).toHaveBeenCalledWith('Error processing DLQ event', {
    error: new Error(expectedError),
  });
});

test('multiple events', async () => {
  const event = sqsEvent(
    { bucket: 's3 bucket', file_path: 'fp1' },
    'hello world',
    { fileMetadata: JSON.stringify({ bucket: 's3 bucket', file_path: 'fp2' }) },
    { hello: 'world' },
    { Records: [{ s3: { object: { key: 'fp3' } } }] },
  );

  mockEventbridgeClient
    .on(PutEventsCommand, { Entries: [{ ...EVENTBRIDGE_ENTRY_BASE, Detail: JSON.stringify({ filepath: 'fp1' }) }] })
    .resolves({})
    .on(PutEventsCommand, { Entries: [{ ...EVENTBRIDGE_ENTRY_BASE, Detail: JSON.stringify({ filepath: 'fp2' }) }] })
    .resolves({})
    .on(PutEventsCommand, { Entries: [{ ...EVENTBRIDGE_ENTRY_BASE, Detail: JSON.stringify({ filepath: 'fp3' }) }] })
    .resolves({});

  const batchResponse = await handler(event);
  expect(batchResponse.batchItemFailures).toHaveLength(2);
  expect(batchResponse.batchItemFailures[0]).toEqual({ itemIdentifier: event.Records[1].messageId });
  expect(batchResponse.batchItemFailures[1]).toEqual({ itemIdentifier: event.Records[3].messageId });

  expect(mockEventbridgeClient.calls()).toHaveLength(3);

  expect(loggerSpy).toHaveBeenCalledTimes(2);
  expect(loggerSpy).toHaveBeenCalledWith('Error processing DLQ event', {
    error: new Error('Could not parse input event as any of the expected event types'),
  });
  expect(loggerSpy).toHaveBeenCalledWith('Error processing DLQ event', {
    error: new Error('Unexpected token \'h\', "hello world" is not valid JSON'),
  });
});
