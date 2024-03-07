import type { Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DescribeAssetBundleExportJobCommand,
  QuickSightClient,
  StartAssetBundleExportJobCommand,
} from '@aws-sdk/client-quicksight';
import type { AssetBundleExportJobStatus } from '@aws-sdk/client-quicksight';
import type { QuicksightExportEvent } from './handler';
import { handler } from './handler';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const ACCOUNT_ID = '123456789012';

const CONTEXT: Context = {
  invokedFunctionArn: `arn:aws:lambda:eu-west-2:${ACCOUNT_ID}:function:LambdaFunctionName`,
} as unknown as Context;

const mockQuicksightClient = mockClient(QuickSightClient);
const mockS3Client = mockClient(S3Client);

beforeEach(() => {
  mockQuicksightClient.reset();
  mockQuicksightClient.callsFake(input => {
    throw new Error(`Unexpected Quicksight request - ${JSON.stringify(input)}`);
  });

  mockS3Client.reset();
  mockS3Client.callsFake(input => {
    throw new Error(`Unexpected S3 request - ${JSON.stringify(input)}`);
  });

  // mock binary returned by downloading from the download url
  global.fetch = jest.fn().mockResolvedValueOnce({ arrayBuffer: async () => new ArrayBuffer(4) });
});

test('success', async () => {
  const event = getEvent();
  setupQuicksightMocks(event);
  setupS3Mocks(event);
  const response = await handler(event, CONTEXT);
  expect(response).toMatchObject(event);
  // can't just expect it to equal filenameFromAnalysisId(event.analysisId) as the timestamps may not match
  expect(response.filename).toEqual(
    expect.stringMatching(`export-${event.analysisId.replaceAll('-', '')}-\\d{8}T\\d{6}.zip`),
  );

  expect(mockQuicksightClient.calls()).toHaveLength(3);
  expect(mockS3Client.calls()).toHaveLength(1);
});

test('bad analysis id', async () => {
  const event = getEvent({ analysisId: '1234' });
  setupQuicksightMocks(event);
  setupS3Mocks(event);
  await expect(handler(event, CONTEXT)).rejects.toThrow('Analysis id must be a valid UUID - received 1234');

  expect(mockQuicksightClient.calls()).toHaveLength(0);
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('start job bad status', async () => {
  const event = getEvent();
  const startJobStatus = 400;
  setupQuicksightMocks(event, { startJobStatus });
  setupS3Mocks(event);
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Start export job request with id ${event.analysisId} returned status code of ${startJobStatus}`,
  );

  expect(mockQuicksightClient.calls()).toHaveLength(1);
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('start job throws', async () => {
  const event = getEvent();
  const startJobError = 'Error starting job';
  setupQuicksightMocks(event, { startJobError });
  setupS3Mocks(event);
  await expect(handler(event, CONTEXT)).rejects.toThrow(startJobError);

  expect(mockQuicksightClient.calls()).toHaveLength(1);
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('export not successful', async () => {
  const event = getEvent();
  const exportFinalStatus = 'FAILED';
  setupQuicksightMocks(event, { exportFinalStatus });
  setupS3Mocks(event);
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Job did not complete in 120000ms - final status was ${exportFinalStatus}`,
  );

  expect(mockQuicksightClient.calls()).toHaveLength(3);
  expect(mockS3Client.calls()).toHaveLength(0);
});

test('s3 error', async () => {
  const event = getEvent();
  const putObjectFailure = 'Error uploading object';
  setupQuicksightMocks(event);
  setupS3Mocks(event, { putObjectFailure });
  await expect(handler(event, CONTEXT)).rejects.toThrow(putObjectFailure);

  expect(mockQuicksightClient.calls()).toHaveLength(3);
  expect(mockS3Client.calls()).toHaveLength(1);
});

const getEvent = (event?: Partial<QuicksightExportEvent>): QuicksightExportEvent => {
  return {
    analysisId: event?.analysisId ?? 'abf33eb0-dcff-405d-846c-9fc7e007a2bf',
    bucketName: event?.analysisId ?? 'export-bucket',
  };
};

interface QuicksightMocksConfig {
  startJobStatus?: number;
  startJobError?: string;
  exportFinalStatus?: AssetBundleExportJobStatus;
}

const setupQuicksightMocks = (event: QuicksightExportEvent, config?: QuicksightMocksConfig): void => {
  const analysisArn = `arn:aws:quicksight:eu-west-2:${ACCOUNT_ID}:analysis/${event.analysisId}`;
  mockQuicksightClient
    .on(StartAssetBundleExportJobCommand, { AwsAccountId: ACCOUNT_ID, ResourceArns: [analysisArn] })
    .resolvesOnce({ Status: config?.startJobStatus ?? 200, AssetBundleExportJobId: event.analysisId })
    .on(DescribeAssetBundleExportJobCommand, { AwsAccountId: ACCOUNT_ID, AssetBundleExportJobId: event.analysisId })
    .resolvesOnce({ Status: 200, JobStatus: 'IN_PROGRESS', DownloadUrl: undefined })
    .resolves({
      Status: 200,
      JobStatus: config?.exportFinalStatus ?? 'SUCCESSFUL',
      DownloadUrl: 'https://download-url.com',
    });

  if (config?.startJobError !== undefined) {
    mockQuicksightClient
      .on(StartAssetBundleExportJobCommand, { AwsAccountId: ACCOUNT_ID, ResourceArns: [analysisArn] })
      .rejects(config?.startJobError);
  }
};

const setupS3Mocks = (event: QuicksightExportEvent, config?: { putObjectFailure?: string }): void => {
  // can't (easily) specify Key alongside Bucket in the input object as it contains a timestamp so check it with expect() in a callsFakeOnce block
  const flatId = event.analysisId.replaceAll('-', '');
  mockS3Client.on(PutObjectCommand, { Bucket: event.bucketName }).callsFakeOnce(async input => {
    expect(input.Key).toEqual(expect.stringMatching(`export-${flatId}-\\d{8}T\\d{6}.zip`));
    if (config?.putObjectFailure !== undefined) {
      throw new Error(config?.putObjectFailure);
    }
    return {};
  });
};
