import { getLogger } from '../../../common/powertools';
import { getEnvironmentVariable } from '../../../common/utilities/utils';
import { redshiftServerlessClient } from '../../../common/clients';
import { CreateSnapshotCommand, CreateSnapshotCommandOutput } from '@aws-sdk/client-redshift-serverless';

export const logger = getLogger('lambda/redshift-create-snapshot');

export const handler = async (): Promise<void> => {
  try {
    const namespaceName = getEnvironmentVariable('NAMESPACE_NAME');
    const retentionPeriod = Number.parseInt(getEnvironmentVariable('RETENTION_PERIOD_DAYS'), 10);
    const response = await createSnapshot(namespaceName, retentionPeriod);
    logger.info('Snapshot creation initiated', { response });
  } catch (error) {
    logger.error('Error creating redshift snapshot', { error });
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
