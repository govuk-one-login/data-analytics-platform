import { mockClient } from 'aws-sdk-client-mock';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getTestResource, mockS3BodyStream } from '../../shared/utils/test-utils';
import { handler } from './handler';
import type {
  AthenaGetStatementEvent,
  RawLayerProcessingAction,
  RawLayerProcessingConfigObject,
} from '../../shared/types/raw-layer-processing';
import type { AWS_ENVIRONMENTS } from '../../shared/constants';

const mockS3Client = mockClient(S3Client);

let TEST_EVENT: AthenaGetStatementEvent;
let DATASOURCE: string;
let EVENT_NAME: string;
let PRODUCT_FAMILY: string;
let ENVIRONMENT: (typeof AWS_ENVIRONMENTS)[number] | '';

const setTestEvent = async (action: RawLayerProcessingAction): Promise<void> => {
  const event = JSON.parse(await getTestResource('AthenaGetStatementEvent.json'));
  TEST_EVENT = { ...event, action };
  DATASOURCE = TEST_EVENT.datasource;
  EVENT_NAME = TEST_EVENT.configObject.event_name;
  PRODUCT_FAMILY = TEST_EVENT.configObject.product_family;
};

const setEnvironment = (environment: (typeof AWS_ENVIRONMENTS)[number] | ''): void => {
  ENVIRONMENT = process.env.ENVIRONMENT = environment;
};

beforeEach(async () => {
  mockS3Client.reset();
  setEnvironment('dev');
  await setTestEvent('GetInsertQuery');
});

test('missing required params', async () => {
  mockS3Client.resolves({});

  const missingDatasource = { ...TEST_EVENT } as unknown as Partial<AthenaGetStatementEvent>;
  delete missingDatasource.datasource;
  await expect(handler(missingDatasource as unknown as AthenaGetStatementEvent)).rejects.toThrow(
    'Object is missing the following required fields: datasource',
  );

  const missingBucket = { ...TEST_EVENT } as unknown as Partial<AthenaGetStatementEvent>;
  delete missingBucket.S3MetaDataBucketName;
  await expect(handler(missingBucket as unknown as AthenaGetStatementEvent)).rejects.toThrow(
    'Object is missing the following required fields: S3MetaDataBucketName',
  );

  const missingAction = { ...TEST_EVENT } as unknown as Partial<AthenaGetStatementEvent>;
  delete missingAction.action;
  await expect(handler(missingAction as unknown as AthenaGetStatementEvent)).rejects.toThrow(
    'Object is missing the following required fields: action',
  );

  const missingConfigObject = { ...TEST_EVENT } as unknown as Partial<AthenaGetStatementEvent>;
  delete missingConfigObject.configObject;
  await expect(handler(missingConfigObject as unknown as AthenaGetStatementEvent)).rejects.toThrow(
    'Object is missing the following required fields: configObject',
  );
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('unknown action', async () => {
  mockS3Client.resolves({});

  const event: AthenaGetStatementEvent = {
    ...TEST_EVENT,
    action: 'NotAnAction' as unknown as RawLayerProcessingAction,
  };
  await expect(handler(event)).rejects.toThrow('Unknown action "NotAnAction"');
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('missing environment', async () => {
  mockS3Client.resolves({});

  delete process.env.ENVIRONMENT;
  await expect(handler(TEST_EVENT)).rejects.toThrow('ENVIRONMENT is not defined in this environment');

  setEnvironment('');
  await expect(handler(TEST_EVENT)).rejects.toThrow('ENVIRONMENT is not defined in this environment');

  expect(mockS3Client.calls()).toHaveLength(0);
});

test('getinsertquery needs valid config object', async () => {
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

test('getpartitionquery does not need valid config object', async () => {
  await setTestEvent('GetPartitionQuery');
  mockS3Client.resolves({ Body: mockS3BodyStream({ stringValue: 'hello' }) });

  // different error here as it's caused by getRequiredParams
  await testBadConfig(null, 'Object is missing the following required fields: configObject');

  await handler(eventWithBadConfigObject({}));
  await handler(eventWithBadConfigObject({ queryResult: null }));
  await handler(eventWithBadConfigObject({ queryResult: {} }));
  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: null } }));
  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: {} } }));
  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: { Rows: null } } }));
  expect(mockS3Client.calls()).toHaveLength(6);
});

test('client error', async () => {
  mockS3Client.rejects('S3 Error');

  await expect(handler(TEST_EVENT)).rejects.toThrow('S3 Error');
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('getinsertquery needs valid row and data', async () => {
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

test('getpartitionquery does not need valid row and data', async () => {
  await setTestEvent('GetPartitionQuery');
  mockS3Client.resolves({ Body: mockS3BodyStream({ stringValue: 'hello' }) });

  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: { Rows: [] } } }));
  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: { Rows: [null] } } }));
  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: { Rows: [{}] } } }));
  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: { Rows: [{ Data: null }] } } }));
  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: { Rows: [{ Data: {} }] } } }));
  await handler(eventWithBadConfigObject({ queryResult: { ResultSet: { Rows: [{ Data: { VarCharValue: null } }] } } }));
  await handler(
    eventWithBadConfigObject({ queryResult: { ResultSet: { Rows: [{ Data: { VarCharValue: undefined } }] } } }),
  );
  expect(mockS3Client.calls()).toHaveLength(7);
});

test('get insert query success', async () => {
  // make the mock client reject on any call except one with the correct S3 bucket and key
  mockS3Client
    .rejects()
    .on(GetObjectCommand, {
      Bucket: TEST_EVENT.S3MetaDataBucketName,
      Key: `${DATASOURCE}/insert_statements/${EVENT_NAME}.sql`,
    })
    .resolves({ Body: mockS3BodyStream({ stringValue: await getTestResource('AUTH_CREATE_ACCOUNT.sql') }) });

  const response = await handler({ ...TEST_EVENT, action: 'GetInsertQuery' });

  expect(response).toBeDefined();
  const expectedFilterValue =
    TEST_EVENT.configObject.queryResult.ResultSet?.Rows?.at(1)?.Data?.at(0)?.VarCharValue?.toString() ?? '';
  expect(response).toContain(`CAST(concat(year, month, day) AS INT) > ${expectedFilterValue} AND`);
  expect(response).toContain(`INSERT INTO "${ENVIRONMENT}-txma-stage"."auth_user_account"`);
  expect(response).toContain(`"${ENVIRONMENT}-txma-raw"."auth_create_account"`);
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('get partition query success', async () => {
  // make the mock client reject on any call except one with the correct S3 bucket and key
  mockS3Client
    .rejects()
    .on(GetObjectCommand, {
      Bucket: TEST_EVENT.S3MetaDataBucketName,
      Key: `${DATASOURCE}/utils/get_query_partition.sql`,
    })
    .resolves({ Body: mockS3BodyStream({ stringValue: await getTestResource('get_query_partition.sql') }) });

  const response = await handler({ ...TEST_EVENT, action: 'GetPartitionQuery' });

  expect(response).toBeDefined();
  expect(response).toContain(`FROM "${ENVIRONMENT}-txma-stage"."${PRODUCT_FAMILY}$partitions"`);
  expect(response).toContain(`FROM "${ENVIRONMENT}-txma-stage"."${PRODUCT_FAMILY}" stg,`);
  expect(response).toContain(`WHERE event_name = '${EVENT_NAME.toUpperCase()}'`);
  expect(response).toContain(`event_name = '${EVENT_NAME.toUpperCase()}' AND`);
  expect(mockS3Client.calls()).toHaveLength(1);
});

const testBadConfig = async (configObject: unknown, expectedErrorMessage: string): Promise<void> => {
  await expect(handler(eventWithBadConfigObject(configObject))).rejects.toThrow(expectedErrorMessage);
};

const eventWithBadConfigObject = (configObject: unknown): AthenaGetStatementEvent => {
  return { ...TEST_EVENT, configObject: configObject as RawLayerProcessingConfigObject };
};
