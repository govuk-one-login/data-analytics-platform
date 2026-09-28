import { logger } from '../../shared/logger';
import { ensureDefined, getAccountId } from '../../shared/utils/utils';
import { quicksightClient, s3Client } from '../../shared/clients';
import type { DescribeAssetBundleExportJobCommandOutput } from '@aws-sdk/client-quicksight';
import { DescribeAssetBundleExportJobCommand, StartAssetBundleExportJobCommand } from '@aws-sdk/client-quicksight';
import type { Context } from 'aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { waitForJob } from '../../shared/utils/wait-for-job';
import { filenameFromAnalysisId } from '../../shared/quicksight-import-export/filename-utils';

// see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;

export interface QuicksightExportEvent {
  analysisId: string;
  bucketName: string;
}

type QuicksightExportResult = QuicksightExportEvent & { filename: string };

export const handler = async (event: QuicksightExportEvent, context: Context): Promise<QuicksightExportResult> => {
  logger.addContext(context);
  try {
    // do this early as it also acts as validation of the analysis id
    const filename = filenameFromAnalysisId(event.analysisId);
    const accountId = getAccountId(context);
    logger.info('Starting quicksight export', { analysisId: event.analysisId, bucketName: event.bucketName });
    const jobId = await startExportJob(event, accountId);
    const downloadUrl = await waitForExportToFinish(jobId, accountId);
    await uploadToS3(event, downloadUrl, filename);
    return { ...event, filename };
  } catch (error) {
    logger.error('Error in quicksight export', {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw error;
  }
};

const startExportJob = async (event: QuicksightExportEvent, accountId: string): Promise<string> => {
  const analysisArn = `arn:aws:quicksight:${region}:${accountId}:analysis/${event.analysisId}`;
  const jobId = `export-${Math.random().toString(36).substring(2)}`;
  const response = await quicksightClient.send(
    new StartAssetBundleExportJobCommand({
      AwsAccountId: accountId,
      AssetBundleExportJobId: jobId,
      ResourceArns: [analysisArn],
      ExportFormat: 'QUICKSIGHT_JSON',
      IncludeAllDependencies: false,
      IncludePermissions: true,
    }),
  );
  if (!response?.Status?.toString().startsWith('2')) {
    throw new Error(
      `Start export job request with id ${response?.AssetBundleExportJobId} returned status code of ${response.Status}`,
    );
  }
  logger.info('Export job started', { jobId });
  return ensureDefined(() => response.AssetBundleExportJobId);
};

const waitForExportToFinish = async (jobId: string, accountId: string): Promise<string> => {
  const response = await waitForJob<DescribeAssetBundleExportJobCommandOutput>({
    statusGetter: async () => await describeExportJob(jobId, accountId),
    statusStringGetter: response => response.JobStatus,
    successStatuses: ['SUCCESSFUL'],
    failureStatuses: ['FAILED'],
    onError: response => {
      logger.error('Export job did not complete', {
        status: response?.JobStatus,
        errors: response?.Errors,
        warnings: response?.Warnings,
      });
    },
  });
  return ensureDefined(() => response.DownloadUrl);
};

const describeExportJob = async (
  exportJobId: string,
  accountId: string,
): Promise<DescribeAssetBundleExportJobCommandOutput> => {
  try {
    return await quicksightClient.send(
      new DescribeAssetBundleExportJobCommand({
        AssetBundleExportJobId: exportJobId,
        AwsAccountId: accountId,
      }),
    );
  } catch (error) {
    logger.error('Error checking status of export job', {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw error;
  }
};

const uploadToS3 = async (event: QuicksightExportEvent, downloadUrl: string, key: string): Promise<void> => {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: event.bucketName,
        Key: key,
        Body: await fetch(downloadUrl)
          .then(async response => await response.arrayBuffer())
          .then(arrayBuffer => Buffer.from(arrayBuffer)),
      }),
    );
  } catch (error) {
    logger.error('Error uploading export bundle to S3', {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw error;
  }
};
