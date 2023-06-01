import { mockClient } from 'aws-sdk-client-mock';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getTestResource } from '../../shared/utils/test-utils';
import { handler } from './handler';
import type {
  RawLayerProcessingAction,
  RawLayerProcessingConfigObject,
  RawLayerProcessingEvent,
} from '../../shared/types/raw-layer-processing';
import type { SdkStream } from '@aws-sdk/types';
import type { Readable } from 'stream';

jest.spyOn(console, 'log').mockImplementation(() => undefined);
jest.spyOn(console, 'error').mockImplementation(() => undefined);

const mockS3Client = mockClient(S3Client);

let TEST_EVENT: Required<RawLayerProcessingEvent>;
let DATASOURCE: string;
let EVENT_NAME: string;

beforeAll(async () => {
  TEST_EVENT = JSON.parse(await getTestResource('AthenaGetStatementEvent.json'));
  DATASOURCE = TEST_EVENT.datasource;
  EVENT_NAME = TEST_EVENT.configObject.event_name;
});

beforeEach(() => mockS3Client.reset());

test('missing required params', async () => {
  mockS3Client.resolves({});

  const missingDatasource = { ...TEST_EVENT } as unknown as Partial<RawLayerProcessingEvent>;
  delete missingDatasource.datasource;
  await expect(handler(missingDatasource as unknown as RawLayerProcessingEvent)).rejects.toThrow(
    'Object is missing the following required fields: datasource'
  );

  const missingBucket = { ...TEST_EVENT } as unknown as Partial<RawLayerProcessingEvent>;
  delete missingBucket.S3MetaDataBucketName;
  await expect(handler(missingBucket as unknown as RawLayerProcessingEvent)).rejects.toThrow(
    'Object is missing the following required fields: S3MetaDataBucketName'
  );

  const missingAction = { ...TEST_EVENT } as unknown as Partial<RawLayerProcessingEvent>;
  delete missingAction.action;
  await expect(handler(missingAction as unknown as RawLayerProcessingEvent)).rejects.toThrow(
    'Object is missing the following required fields: action'
  );

  const missingConfigObject = { ...TEST_EVENT } as unknown as RawLayerProcessingEvent;
  delete missingConfigObject.configObject;
  await expect(handler(missingConfigObject as unknown as RawLayerProcessingEvent)).rejects.toThrow(
    'Object is missing the following required fields: configObject'
  );
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('unknown action', async () => {
  mockS3Client.resolves({});

  const event: RawLayerProcessingEvent = {
    ...TEST_EVENT,
    action: 'NotAnAction' as unknown as RawLayerProcessingAction,
  };
  await expect(handler(event)).rejects.toThrow('Unknown action "NotAnAction"');
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('bad config object', async () => {
  mockS3Client.resolves({});

  // different error here as it's caused by getRequiredParams
  await testBadConfig(null, 'Object is missing the following required fields: configObject');

  const expectedError = 'Missing ConfigObject, ResultSet or Rows';
  await testBadConfig({}, expectedError);
  await testBadConfig({ queryResult: null }, expectedError);
  await testBadConfig({ queryResult: {} }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: null } }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: {} } }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: { Rows: null } } }, expectedError);
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('client error', async () => {
  mockS3Client.rejectsOnce('S3 Error');

  await expect(handler(TEST_EVENT)).rejects.toThrow('S3 Error');
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('bad row or data', async () => {
  mockS3Client.resolves({});

  const expectedError = 'Row number 1 or its Data at position 0 is missing or invalid';
  await testBadConfig({ queryResult: { ResultSet: { Rows: [] } } }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: { Rows: [null] } } }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: { Rows: [{}] } } }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: { Rows: [{ Data: null }] } } }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: { Rows: [{ Data: {} }] } } }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: { Rows: [{ Data: { VarCharValue: null } }] } } }, expectedError);
  await testBadConfig({ queryResult: { ResultSet: { Rows: [{ Data: { VarCharValue: undefined } }] } } }, expectedError);
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('get insert query success', async () => {
  const mockBodyStream: unknown = {
    transformToString: async () => await getTestResource('auth_create_account.sql'),
  };
  // make the mock client reject on any call except one with the correct S3 bucket and key
  mockS3Client
    .rejects()
    .on(GetObjectCommand, {
      Bucket: TEST_EVENT.S3MetaDataBucketName,
      Key: `${DATASOURCE}/insert_statements/${EVENT_NAME}.sql`,
    })
    .resolves({ Body: mockBodyStream as SdkStream<Readable | ReadableStream | Blob> });

  const response = await handler({ ...TEST_EVENT, action: 'GetInsertQuery' });

  expect(response).toBeDefined();
  const expectedFilterValue =
    TEST_EVENT.configObject.queryResult.ResultSet?.Rows?.at(1)?.Data?.at(0)?.VarCharValue?.toString() ?? '';
  expect(response).toContain(`WHERE CAST(concat(year, month, day) AS INT) > ${expectedFilterValue} AND`);
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('get partition query success', async () => {
  const mockBodyStream: unknown = {
    transformToString: async () => await getTestResource('get_query_partition.sql'),
  };
  // make the mock client reject on any call except one with the correct S3 bucket and key
  mockS3Client
    .rejects()
    .on(GetObjectCommand, {
      Bucket: TEST_EVENT.S3MetaDataBucketName,
      Key: `${DATASOURCE}/utils/get_query_partition.sql`,
    })
    .resolves({ Body: mockBodyStream as SdkStream<Readable | ReadableStream | Blob> });

  const response = await handler({ ...TEST_EVENT, action: 'GetPartitionQuery' });

  expect(response).toBeDefined();
  expect(response).toContain(`FROM "stage-layer"."${EVENT_NAME}$partitions"`);
  expect(response).toContain(`FROM "stage-layer"."${EVENT_NAME}" stg,`);
  expect(mockS3Client.calls()).toHaveLength(1);
});

const testBadConfig = async (configObject: unknown, expectedErrorMessage: string): Promise<void> => {
  await expect(handler(eventWithBadConfigObject(configObject))).rejects.toThrow(expectedErrorMessage);
};

const eventWithBadConfigObject = (configObject: unknown): RawLayerProcessingEvent => {
  return { ...TEST_EVENT, configObject: configObject as RawLayerProcessingConfigObject };
};
