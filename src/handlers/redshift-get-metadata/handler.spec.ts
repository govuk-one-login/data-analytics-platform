import type { RedshiftGetMetadataEvent } from './handler';
import { handler } from './handler';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { getTestResource, mockS3BodyStream } from '../../shared/utils/test-utils';
import type { RedshiftConfig } from '../../shared/types/redshift-metadata';

const mockS3Client = mockClient(S3Client);

const METADATA_BUCKET_NAME = 'dev-dap-elt-metadata';

const METADATA_KEY = 'reference_data/configuration_files/data_analytics_reference_data_configuration.json';

let TEST_EVENT: RedshiftGetMetadataEvent;

let TEST_CONFIG_FILE: string;

beforeAll(async () => {
  TEST_EVENT = {
    fileMetadata: JSON.stringify({
      bucket: METADATA_BUCKET_NAME,
      file_path: 'reference-data/data_analytics/benefits_dashboard/20240305/account_login_2024-03-05_22-12-04.csv',
    }),
  };
  TEST_CONFIG_FILE = await getTestResource('redshift-metadata-config.json');
});

beforeEach(() => {
  mockS3Client.reset();
  mockS3Client.callsFake(input => {
    throw new Error(`Unexpected S3 request - ${JSON.stringify(input)}`);
  });

  process.env.METADATA_BUCKET_NAME = METADATA_BUCKET_NAME;
});

test('bad input events', async () => {
  mockS3Client.resolves({});

  const missingBucket = {
    fileMetadata: JSON.stringify({ file_path: 'file_path' }),
  } as unknown as RedshiftGetMetadataEvent;
  await expect(handler(missingBucket)).rejects.toThrow('Object is missing the following required fields: bucket');

  const missingFilePath = {
    fileMetadata: JSON.stringify({ bucket: 'bucket' }),
  } as unknown as RedshiftGetMetadataEvent;
  await expect(handler(missingFilePath)).rejects.toThrow('Object is missing the following required fields: file_path');

  const missingBoth = { fileMetadata: JSON.stringify({}) } as unknown as RedshiftGetMetadataEvent;
  await expect(handler(missingBoth)).rejects.toThrow(
    'Object is missing the following required fields: bucket, file_path',
  );

  await expect(handler(null as unknown as RedshiftGetMetadataEvent)).rejects.toThrow('Object is null or undefined');
  await expect(handler(undefined as unknown as RedshiftGetMetadataEvent)).rejects.toThrow(
    'Object is null or undefined',
  );
  await expect(handler({} as unknown as RedshiftGetMetadataEvent)).rejects.toThrow(
    'Object is missing the following required fields: fileMetadata',
  );
  await expect(handler({ fileMetadata: null } as unknown as RedshiftGetMetadataEvent)).rejects.toThrow(
    'Object is missing the following required fields: fileMetadata',
  );
  await expect(handler({ fileMetadata: undefined } as unknown as RedshiftGetMetadataEvent)).rejects.toThrow(
    'Object is missing the following required fields: fileMetadata',
  );

  expect(mockS3Client.calls()).toHaveLength(0);
});

test('missing bucket name', async () => {
  process.env.METADATA_BUCKET_NAME = '';

  await expect(handler(TEST_EVENT)).rejects.toThrow('METADATA_BUCKET_NAME is not defined in this environment');

  expect(mockS3Client.calls()).toHaveLength(0);
});

test('file parts parse error', async () => {
  const badFilePath = 'bad/path.csv';
  const badFilePathEvent: RedshiftGetMetadataEvent = {
    fileMetadata: JSON.stringify({ bucket: METADATA_BUCKET_NAME, file_path: badFilePath }),
  };

  await expect(handler(badFilePathEvent)).rejects.toThrow(`Unable to parse key path string "${badFilePath}"`);

  expect(mockS3Client.calls()).toHaveLength(0);
});

test('s3 error', async () => {
  const error = 's3 error';
  mockS3Client.rejects(error);

  await expect(handler(TEST_EVENT)).rejects.toThrow(error);

  expect(mockS3Client.calls()).toHaveLength(1);
});

test('json parse error', async () => {
  const badJson = 'hi';
  mockS3Client.resolves({ Body: mockS3BodyStream({ stringValue: badJson }) });

  await expect(handler(TEST_EVENT)).rejects.toThrow(
    `Error parsing JSON string "${badJson}" - Unexpected token 'h', "${badJson}" is not valid JSON`,
  );

  expect(mockS3Client.calls()).toHaveLength(1);
});

test('config object errors', async () => {
  const helloWorld = { hello: 'world' };
  mockS3Client
    .resolvesOnce({ Body: mockS3BodyStream({ stringValue: JSON.stringify(helloWorld, null, 2) }) })
    .resolvesOnce({
      Body: mockS3BodyStream({
        stringValue: JSON.stringify({ benefits_dashboard: { data_sources: helloWorld } }, null, 2),
      }),
    })
    .resolvesOnce({
      Body: mockS3BodyStream({
        stringValue: JSON.stringify(
          { benefits_dashboard: { data_sources: { account_login: { redshift_metadata: null } } } },
          null,
          2,
        ),
      }),
    });

  await expect(handler(TEST_EVENT)).rejects.toThrow(`Cannot read properties of undefined (reading 'data_sources')`);

  await expect(handler(TEST_EVENT)).rejects.toThrow(
    `Cannot read properties of undefined (reading 'redshift_metadata')`,
  );

  await expect(handler(TEST_EVENT)).rejects.toThrow(`Metadata was null or undefined`);

  expect(mockS3Client.calls()).toHaveLength(3);
});

test('success', async () => {
  // test first of the file path parts (data_analytics) indirectly by only resolving for a GetObjectCommand with it properly within the Key
  mockS3Client
    .on(GetObjectCommand, {
      Bucket: METADATA_BUCKET_NAME,
      Key: METADATA_KEY,
    })
    .resolves({ Body: mockS3BodyStream({ stringValue: TEST_CONFIG_FILE }) });

  // test second and third of the file path parts (benefits_dashboard and account_login) indirectly as they should have led to the right bit of JSON being returned
  const response = await handler(TEST_EVENT);
  expect(response).toBeDefined();

  const parsedFile: RedshiftConfig = JSON.parse(TEST_CONFIG_FILE);
  expect(response).toEqual(JSON.stringify(parsedFile.benefits_dashboard.data_sources.account_login.redshift_metadata));

  expect(mockS3Client.calls()).toHaveLength(1);
});
