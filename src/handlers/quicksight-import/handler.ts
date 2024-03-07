import { getLogger } from '../../shared/powertools';
import { quicksightClient } from '../../shared/clients';
import type {
  DescribeAssetBundleImportJobCommandOutput,
  StartAssetBundleImportJobCommandInput,
} from '@aws-sdk/client-quicksight';
import { DescribeAssetBundleImportJobCommand, StartAssetBundleImportJobCommand } from '@aws-sdk/client-quicksight';
import type { Context } from 'aws-lambda';
import { ensureDefined, getAccountId } from '../../shared/utils/utils';
import { waitForJob } from '../../shared/utils/wait-for-job';
import { analysisIdFromS3Uri } from '../../shared/quicksight-import-export/filename-utils';

const logger = getLogger('lambda/quicksight-import');

export interface QuicksightImportEvent {
  s3Uri: string;
  newName: string | null;
}

type QuicksightImportResult = QuicksightImportEvent & { analysisId: string };

export const handler = async (event: QuicksightImportEvent, context: Context): Promise<QuicksightImportResult> => {
  try {
    // do this early as it also acts as validation of the s3 uri
    const analysisId = analysisIdFromS3Uri(event.s3Uri);
    const accountId = getAccountId(context);
    logger.info('Starting quicksight import', { event });
    const jobId = await startImportJob(event, accountId, analysisId);
    await waitForImportToFinish(jobId, accountId);
    return { ...event, analysisId };
  } catch (error) {
    logger.error('Error in quicksight import', { error });
    throw error;
  }
};

const startImportJob = async (event: QuicksightImportEvent, accountId: string, analysisId: string): Promise<string> => {
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
  if (response.Status === undefined || !response.Status.toString().startsWith('2')) {
    throw new Error(
      `Start import job request with id ${response.AssetBundleImportJobId} returned status code of ${response.Status}`,
    );
  }
  logger.info(`Import started with id ${jobId}`);
  return ensureDefined(() => response.AssetBundleImportJobId);
};

const waitForImportToFinish = async (jobId: string, accountId: string): Promise<void> => {
  await waitForJob<DescribeAssetBundleImportJobCommandOutput>({
    statusGetter: async () => await describeImportJob(jobId, accountId),
    statusStringGetter: response => response.JobStatus,
    successStatuses: ['SUCCESSFUL'],
    failureStatuses: ['FAILED', 'FAILED_ROLLBACK_COMPLETED', 'FAILED_ROLLBACK_ERROR'],
    onError: response => {
      logger.error('Import job did not complete', {
        status: response?.JobStatus,
        errors: response?.Errors,
        rollbackErrors: response?.RollbackErrors,
      });
    },
  });
};

const describeImportJob = async (
  importJobId: string,
  accountId: string,
): Promise<DescribeAssetBundleImportJobCommandOutput> => {
  try {
    return await quicksightClient.send(
      new DescribeAssetBundleImportJobCommand({
        AssetBundleImportJobId: importJobId,
        AwsAccountId: accountId,
      }),
    );
  } catch (error) {
    logger.error('Error checking status of import job', { error });
    throw error;
  }
};
