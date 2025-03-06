import { handler } from './handler';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import type { AthenaGetConfigEvent } from '../../shared/types/raw-layer-processing';
import { getTestResource, mockS3BodyStream } from '../../shared/utils/test-utils';

const mockS3Client = mockClient(S3Client);

let TEST_EVENT: AthenaGetConfigEvent;

beforeAll(async () => {
  TEST_EVENT = JSON.parse(await getTestResource('AthenaGetConfigEvent.json'));
});

beforeEach(() => mockS3Client.reset());

test('missing required params', async () => {
  mockS3Client.resolves({});

  const missingDatasource = {
    S3MetaDataBucketName: 'elt-metadata',
    configFilePrefix: 'auth_account_creation',
  } as unknown as AthenaGetConfigEvent;
  await expect(handler(missingDatasource)).rejects.toThrow(
    'Object is missing the following required fields: datasource',
  );

  const missingBucket = {
    datasource: 'txma',
    configFilePrefix: 'auth_account_creation',
  } as unknown as AthenaGetConfigEvent;
  await expect(handler(missingBucket)).rejects.toThrow(
    'Object is missing the following required fields: S3MetaDataBucketName',
  );

  const missingConfigFilePrefix = {
    datasource: 'txma',
    S3MetaDataBucketName: 'elt-metadata',
  } as unknown as AthenaGetConfigEvent;
  await expect(handler(missingConfigFilePrefix)).rejects.toThrow(
    'Object is missing the following required fields: configFilePrefix',
  );
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('client error', async () => {
  mockS3Client.rejects('S3 Error');

  await expect(handler(TEST_EVENT)).rejects.toThrow('S3 Error');
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('body is undefined', async () => {
  mockS3Client.resolves({ Body: mockS3BodyStream({ stringValue: undefined }) });

  await expect(handler(TEST_EVENT)).rejects.toThrow('S3 response body was undefined');
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('bad json', async () => {
  mockS3Client.resolves({ Body: mockS3BodyStream({ stringValue: 'hi' }) });

  await expect(handler(TEST_EVENT)).rejects.toThrow(
    'Error parsing JSON string "hi" - Unexpected token \'h\', "hi" is not valid JSON',
  );
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('success', async () => {
  // make the mock client reject on any call except one with the correct S3 bucket and key
  mockS3Client
    .rejects()
    .on(GetObjectCommand, {
      Bucket: TEST_EVENT.S3MetaDataBucketName,
      Key: `${TEST_EVENT.datasource}/process_config/${TEST_EVENT.configFilePrefix}_config.json`,
    })
    .resolves({ Body: mockS3BodyStream({ stringValue: await getTestResource('txma_config.json') }) });

  const response = await handler(TEST_EVENT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(2);
  expect(response[0]).toEqual({ event_name: 'auth_create_account', enabled: true });
  expect(response[1]).toEqual({ event_name: 'dcmaw_app_start', enabled: false });
  expect(mockS3Client.calls()).toHaveLength(1);
});
