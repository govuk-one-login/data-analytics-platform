import { handler } from './handler';
import { S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import type { RawLayerProcessingEvent } from '../../shared/types/raw-layer-processing';
import { getTestResource, mockS3BodyStream } from '../../shared/utils/test-utils';

jest.spyOn(console, 'log').mockImplementation(() => undefined);
jest.spyOn(console, 'error').mockImplementation(() => undefined);

const mockS3Client = mockClient(S3Client);

let TEST_EVENT: RawLayerProcessingEvent;

beforeAll(async () => {
  TEST_EVENT = JSON.parse(await getTestResource('AthenaGetConfigEvent.json'));
});

beforeEach(() => mockS3Client.reset());

test('missing required params', async () => {
  mockS3Client.resolves({});

  const missingDatasource = { S3MetaDataBucketName: 'elt-metadata' } as unknown as RawLayerProcessingEvent;
  await expect(handler(missingDatasource)).rejects.toThrow(
    'Object is missing the following required fields: datasource'
  );

  const missingBucket = { datasource: 'txma' } as unknown as RawLayerProcessingEvent;
  await expect(handler(missingBucket)).rejects.toThrow(
    'Object is missing the following required fields: S3MetaDataBucketName'
  );
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('client error', async () => {
  mockS3Client.rejectsOnce('S3 Error');

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
    'Error parsing JSON string "hi". Original error: SyntaxError: Unexpected token h in JSON at position 0'
  );
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('success', async () => {
  mockS3Client.resolves({ Body: mockS3BodyStream({ stringValue: await getTestResource('txma_config.json') }) });

  const response = await handler(TEST_EVENT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(2);
  expect(response[0]).toEqual({ event_name: 'auth_create_account', enabled: true });
  expect(response[1]).toEqual({ event_name: 'dcmaw_app_start', enabled: false });
  expect(mockS3Client.calls()).toHaveLength(1);
});
