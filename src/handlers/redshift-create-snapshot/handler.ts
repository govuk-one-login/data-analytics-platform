import { logger, initialiseLogger } from '../../shared/logger';
import { buildErrorMetadata, getEnvironmentVariable } from '../../shared/utils/utils';
import { ERROR_CODES } from '../../shared/error-codes';
import { redshiftServerlessClient } from '../../shared/clients';
import { CreateSnapshotCommand, CreateSnapshotCommandOutput } from '@aws-sdk/client-redshift-serverless';
import type { Context } from 'aws-lambda';

export { logger } from '../../shared/logger';

export const handler = async (_event: unknown, context: Context): Promise<void> => {
  initialiseLogger(context);
  const startTime = Date.now();
  const correlationId = context.awsRequestId;
  logger.info('Handler started', { correlationId });

  try {
    const namespaceName = getEnvironmentVariable('NAMESPACE_NAME');
    const retentionPeriod = Number.parseInt(getEnvironmentVariable('RETENTION_PERIOD_DAYS'), 10);
    const response = await createSnapshot(namespaceName, retentionPeriod);
    logger.info('Snapshot creation initiated', {
      correlationId,
      snapshotName: response.snapshot?.snapshotName,
      status: response.snapshot?.status,
    });
    logger.info('Handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Error creating redshift snapshot', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.CREATE_SNAPSHOT_FAILED),
    });
    throw error;
  }
};

const createSnapshot = async (namespaceName: string, retentionPeriod: number): Promise<CreateSnapshotCommandOutput> => {
  const snapshotName = `snapshot-${Date.now()}`;
  return await redshiftServerlessClient.send(
    new CreateSnapshotCommand({
      snapshotName,
      namespaceName,
      retentionPeriod,
    }),
  );
};
