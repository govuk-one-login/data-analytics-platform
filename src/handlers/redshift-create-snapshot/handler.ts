import { logger } from '../../shared/logger';
import { getEnvironmentVariable } from '../../shared/utils/utils';
import { redshiftServerlessClient } from '../../shared/clients';
import { CreateSnapshotCommand, CreateSnapshotCommandOutput } from '@aws-sdk/client-redshift-serverless';

export { logger } from '../../shared/logger';

export const handler = async (): Promise<void> => {
  try {
    const namespaceName = getEnvironmentVariable('NAMESPACE_NAME');
    const retentionPeriod = Number.parseInt(getEnvironmentVariable('RETENTION_PERIOD_DAYS'), 10);
    const response = await createSnapshot(namespaceName, retentionPeriod);
    logger.info('Snapshot creation initiated', {
      snapshotName: response.snapshot?.snapshotName,
      status: response.snapshot?.status,
    });
  } catch (error) {
    logger.error('Error creating redshift snapshot', {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      },
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
