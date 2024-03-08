import type { Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DescribeAssetBundleImportJobCommand,
  QuickSightClient,
  StartAssetBundleImportJobCommand,
} from '@aws-sdk/client-quicksight';
import type { AssetBundleImportJobStatus, StartAssetBundleImportJobCommandInput } from '@aws-sdk/client-quicksight';
import type { QuicksightImportEvent } from './handler';
import { handler } from './handler';
import { analysisIdFromS3Uri } from '../../shared/quicksight-import-export/filename-utils';

const ACCOUNT_ID = '123456789012';

const CONTEXT: Context = {
  invokedFunctionArn: `arn:aws:lambda:eu-west-2:${ACCOUNT_ID}:function:LambdaFunctionName`,
} as unknown as Context;

const mockQuicksightClient = mockClient(QuickSightClient);

beforeEach(() => {
  mockQuicksightClient.reset();
  mockQuicksightClient.callsFake(input => {
    throw new Error(`Unexpected Quicksight request - ${JSON.stringify(input)}`);
  });
});

test('success', async () => {
  const event = getEvent();
  setupQuicksightMocks(event);
  const response = await handler(event, CONTEXT);
  expect(response).toEqual({ ...event, analysisId: analysisIdFromS3Uri(event.s3Uri) });

  expect(mockQuicksightClient.calls()).toHaveLength(3);
});

test('success with name change', async () => {
  const event = getEvent({ newName: 'new-name' });
  setupQuicksightMocks(event);
  const response = await handler(event, CONTEXT);
  expect(response).toEqual({ ...event, analysisId: analysisIdFromS3Uri(event.s3Uri) });

  expect(mockQuicksightClient.calls()).toHaveLength(3);
});

test('bad s3 uri', async () => {
  const event = getEvent({ s3Uri: '1234' });
  // eslint-disable-next-line no-template-curly-in-string
  const expectedFormat = 's3://${bucketName}/export-${analysisId}-${timestamp}.zip';
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Invalid S3 URI (expected format '${expectedFormat}') - received 1234`,
  );

  expect(mockQuicksightClient.calls()).toHaveLength(0);
});

test('start job bad status', async () => {
  const event = getEvent();
  const startJobStatus = 400;
  const analysisId = analysisIdFromS3Uri(event.s3Uri);
  setupQuicksightMocks(event, { startJobStatus });
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Start import job request with id ${analysisId} returned status code of ${startJobStatus}`,
  );

  expect(mockQuicksightClient.calls()).toHaveLength(1);
});

test('start job throws', async () => {
  const event = getEvent();
  const startJobError = 'Error starting job';
  setupQuicksightMocks(event, { startJobError });
  await expect(handler(event, CONTEXT)).rejects.toThrow(startJobError);

  expect(mockQuicksightClient.calls()).toHaveLength(1);
});

test('import not successful', async () => {
  const event = getEvent();
  const importFinalStatus = 'FAILED';
  setupQuicksightMocks(event, { importFinalStatus });
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Job did not complete in 120000ms - final status was ${importFinalStatus}`,
  );

  expect(mockQuicksightClient.calls()).toHaveLength(3);
});

interface QuicksightMocksConfig {
  startJobStatus?: number;
  startJobError?: string;
  importFinalStatus?: AssetBundleImportJobStatus;
}

const setupQuicksightMocks = (event: QuicksightImportEvent, config?: QuicksightMocksConfig): void => {
  const analysisId = analysisIdFromS3Uri(event.s3Uri);
  const startCommandInput: Partial<StartAssetBundleImportJobCommandInput> = {
    AwsAccountId: ACCOUNT_ID,
    AssetBundleImportSource: {
      S3Uri: event.s3Uri,
    },
  };
  if (event.newName !== null) {
    startCommandInput.OverrideParameters = {
      Analyses: [
        {
          AnalysisId: analysisId,
          Name: event.newName,
        },
      ],
    };
  }
  mockQuicksightClient
    .on(StartAssetBundleImportJobCommand, startCommandInput)
    .resolvesOnce({ Status: config?.startJobStatus ?? 200, AssetBundleImportJobId: analysisId })
    .on(DescribeAssetBundleImportJobCommand, { AwsAccountId: ACCOUNT_ID, AssetBundleImportJobId: analysisId })
    .resolvesOnce({ Status: 200, JobStatus: 'IN_PROGRESS' })
    .resolves({ Status: 200, JobStatus: config?.importFinalStatus ?? 'SUCCESSFUL' });

  if (config?.startJobError !== undefined) {
    mockQuicksightClient
      .on(StartAssetBundleImportJobCommand, {
        AwsAccountId: ACCOUNT_ID,
        AssetBundleImportSource: { S3Uri: event.s3Uri },
      })
      .rejects(config?.startJobError);
  }
};

const getEvent = (event?: Partial<QuicksightImportEvent>): QuicksightImportEvent => {
  return {
    s3Uri: event?.s3Uri ?? 's3://export-bucket/export-abf33eb0dcff405d846c9fc7e007a2bf-20240304T142412.zip',
    newName: event?.newName ?? null,
  };
};
