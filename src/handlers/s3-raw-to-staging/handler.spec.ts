import { handler } from './handler';
import { mockClient } from 'aws-sdk-client-mock';
import { getTestResource, mockS3BodyStream } from '../../../common/utilities/test-utils';
import type { S3Event } from 'aws-lambda';
import { CopyObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const mockS3Client = mockClient(S3Client);

const METADATA_BUCKET_NAME = 'dev-dap-elt-metadata';

const METADATA_KEY = 'reference_data/configuration_files/data_analytics_reference_data_configuration.json';

const S3_RAW_BUCKET_NAME = 'dev-dap-raw-layer';

const S3_STAGE_BUCKET_NAME = 'dev-dap-stage-layer';

const S3_KEY_PROCESSING_ENABLED =
  'reference-data/data_analytics/benefits_dashboard/20240305/account_login_2024-03-05_22-12-04.csv';

const S3_KEY_PROCESSING_DISABLED =
  'reference-data/data_analytics/benefits_dashboard/20240312/online_id_verification_2024-03-12_16-23-58.csv';

let TEST_CONFIG_FILE: string;

let TEST_EVENT: S3Event;

beforeAll(async () => {
  TEST_EVENT = JSON.parse(await getTestResource('s3-object-creation-notification.json'));
  TEST_EVENT.Records[0].s3.bucket.name = S3_RAW_BUCKET_NAME;
  TEST_EVENT.Records[0].s3.object.key = S3_KEY_PROCESSING_ENABLED;
  TEST_CONFIG_FILE = await getTestResource('redshift-metadata-config.json');
});

beforeEach(() => {
  mockS3Client.reset();
  mockS3Client
    .on(GetObjectCommand, { Bucket: METADATA_BUCKET_NAME, Key: METADATA_KEY })
    .resolvesOnce({ Body: mockS3BodyStream({ stringValue: TEST_CONFIG_FILE }) })
    .callsFake(input => {
      throw new Error(`Unexpected S3 request - ${JSON.stringify(input)}`);
    });

  process.env.METADATA_BUCKET_NAME = METADATA_BUCKET_NAME;
  process.env.STAGE_BUCKET_NAME = S3_STAGE_BUCKET_NAME;
});

test('missing stage bucket name', async () => {
  process.env.STAGE_BUCKET_NAME = '';

  await expect(handler(TEST_EVENT)).rejects.toThrow('STAGE_BUCKET_NAME is not defined in this environment');

  expect(mockS3Client.calls()).toHaveLength(0);
});

test('missing metadata bucket name', async () => {
  process.env.METADATA_BUCKET_NAME = '';

  await expect(handler(TEST_EVENT)).rejects.toThrow('METADATA_BUCKET_NAME is not defined in this environment');

  expect(mockS3Client.calls()).toHaveLength(0);
});

test('success when ingestion enabled', async () => {
  TEST_EVENT.Records[0].s3.object.key = S3_KEY_PROCESSING_ENABLED;

  // test indirectly by only resolving for the expected CopyObjectCommand
  mockS3Client
    .on(CopyObjectCommand, {
      Bucket: S3_STAGE_BUCKET_NAME,
      CopySource: `${S3_RAW_BUCKET_NAME}/${S3_KEY_PROCESSING_ENABLED}`,
      Key: S3_KEY_PROCESSING_ENABLED,
    })
    .resolves({});

  const response = await handler(TEST_EVENT);
  expect(response).toHaveLength(1);
  expect(response[0].filename).toEqual(S3_KEY_PROCESSING_ENABLED);
  expect(response[0].status).toEqual('succeeded');
  expect(response[0].error).toBeUndefined();

  expect(mockS3Client.calls()).toHaveLength(2);
});

test('cancelled when ingestion disabled', async () => {
  TEST_EVENT.Records[0].s3.object.key = S3_KEY_PROCESSING_DISABLED;

  mockS3Client.on(CopyObjectCommand).rejects();

  const response = await handler(TEST_EVENT);
  expect(response).toHaveLength(1);
  expect(response[0].filename).toEqual(S3_KEY_PROCESSING_DISABLED);
  expect(response[0].status).toEqual('cancelled');
  expect(response[0].error).toBeUndefined();

  expect(mockS3Client.calls()).toHaveLength(1);
});

test('failed with s3 error', async () => {
  TEST_EVENT.Records[0].s3.object.key = S3_KEY_PROCESSING_ENABLED;

  const error = 's3 error';

  // test indirectly by only resolving for the expected CopyObjectCommand
  mockS3Client
    .on(CopyObjectCommand, {
      Bucket: S3_STAGE_BUCKET_NAME,
      CopySource: `${S3_RAW_BUCKET_NAME}/${S3_KEY_PROCESSING_ENABLED}`,
      Key: S3_KEY_PROCESSING_ENABLED,
    })
    .rejects(error);

  const response = await handler(TEST_EVENT);
  expect(response).toHaveLength(1);
  expect(response[0].filename).toEqual(S3_KEY_PROCESSING_ENABLED);
  expect(response[0].status).toEqual('failed');
  expect(response[0].error).toEqual(error);

  expect(mockS3Client.calls()).toHaveLength(2);
});
