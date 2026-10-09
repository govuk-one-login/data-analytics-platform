import { logger, initialiseLogger } from '../../shared/logger';
import { quicksightClient } from '../../shared/clients';
import type {
  DescribeAssetBundleImportJobCommandOutput,
  StartAssetBundleImportJobCommandInput,
} from '@aws-sdk/client-quicksight';
import { DescribeAssetBundleImportJobCommand, StartAssetBundleImportJobCommand } from '@aws-sdk/client-quicksight';
import type { Context } from 'aws-lambda';
import { buildErrorMetadata, ensureDefined, getAccountId } from '../../shared/utils/utils';
import { ERROR_CODES } from '../../shared/error-codes';
import { waitForJob } from '../../shared/utils/wait-for-job';
import { analysisIdFromS3Uri } from '../../shared/quicksight-import-export/filename-utils';

export interface QuicksightImportEvent {
  s3Uri: string;
  newName: string | null;
}

type QuicksightImportResult = QuicksightImportEvent & { analysisId: string };

export const handler = async (event: QuicksightImportEvent, context: Context): Promise<QuicksightImportResult> => {
  initialiseLogger(context);
  const startTime = Date.now();
  const correlationId = context.awsRequestId;
  logger.info('Handler started', { correlationId, s3Uri: event.s3Uri });

  try {
    // do this early as it also acts as validation of the s3 uri
    const analysisId = analysisIdFromS3Uri(event.s3Uri);
    const accountId = getAccountId(context);
    logger.info('Starting quicksight import', { correlationId, s3Uri: event.s3Uri, newName: event.newName });
    const jobId = await startImportJob(event, accountId, analysisId, correlationId);
    await waitForImportToFinish(jobId, accountId, correlationId);
    logger.info('Handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
    });
    return { ...event, analysisId };
  } catch (error) {
    logger.error('Error in quicksight import', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.QUICKSIGHT_IMPORT_FAILED),
    });
    throw error;
  }
};

const startImportJob = async (
  event: QuicksightImportEvent,
  accountId: string,
  analysisId: string,
  correlationId: string,
): Promise<string> => {
  const jobId = `import-${Math.random().toString(36).substring(2)}`;
  const input: StartAssetBundleImportJobCommandInput = {
    AwsAccountId: accountId,
    AssetBundleImportJobId: jobId,
    AssetBundleImportSource: {
      S3Uri: event.s3Uri,
    },
  };
  if (event.newName !== null) {
    input.OverrideParameters = {
      Analyses: [
        {
          AnalysisId: analysisId,
          Name: event.newName,
        },
      ],
    };
  }

  const response = await quicksightClient.send(new StartAssetBundleImportJobCommand(input));
  if (!response?.Status?.toString().startsWith('2')) {
    throw new Error(
      `Start import job request with id ${response.AssetBundleImportJobId} returned status code of ${response.Status}`,
    );
  }
  logger.info('Import job started', { correlationId, jobId });
  return ensureDefined(() => response.AssetBundleImportJobId);
};

const waitForImportToFinish = async (jobId: string, accountId: string, correlationId: string): Promise<void> => {
  await waitForJob<DescribeAssetBundleImportJobCommandOutput>({
    statusGetter: async () => await describeImportJob(jobId, accountId, correlationId),
    statusStringGetter: response => response.JobStatus,
    successStatuses: ['SUCCESSFUL'],
    failureStatuses: ['FAILED', 'FAILED_ROLLBACK_COMPLETED', 'FAILED_ROLLBACK_ERROR'],
    onError: response => {
      const error = new Error(`Import job did not complete - status ${response?.JobStatus}`);
      error.name = 'QuicksightImportJobError';
      logger.error('Import job did not complete', {
        correlationId,
        status: response?.JobStatus,
        errors: response?.Errors,
        rollbackErrors: response?.RollbackErrors,
        error: buildErrorMetadata(error, ERROR_CODES.QUICKSIGHT_IMPORT_JOB_INCOMPLETE),
      });
    },
  });
};

const describeImportJob = async (
  importJobId: string,
  accountId: string,
  correlationId: string,
): Promise<DescribeAssetBundleImportJobCommandOutput> => {
  try {
    return await quicksightClient.send(
      new DescribeAssetBundleImportJobCommand({
        AssetBundleImportJobId: importJobId,
        AwsAccountId: accountId,
      }),
    );
  } catch (error) {
    logger.error('Error checking status of import job', {
      correlationId,
      error: buildErrorMetadata(error, ERROR_CODES.QUICKSIGHT_IMPORT_JOB_STATUS_FAILED),
    });
    throw error;
  }
};
