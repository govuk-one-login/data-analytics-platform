import type { S3Event, S3EventRecord } from 'aws-lambda';
import { getEnvironmentVariable, getErrorMessage, getS3EventRecords } from '../../shared/utils/utils';
import { getLogger } from '../../shared/powertools';
import { s3Client } from '../../shared/clients';
import { getDatasource } from '../../shared/manual-reference-data-ingestion/redshift-metadata';
import { CopyObjectCommand } from '@aws-sdk/client-s3';

const logger = getLogger('lambda/s3-raw-to-staging');

type S3RawToStageStatus = 'succeeded' | 'failed' | 'cancelled';

interface S3RawToStageResult {
  filename: string;
  status: S3RawToStageStatus;
  error?: string;
}

export const handler = async (event: S3Event): Promise<S3RawToStageResult[]> => {
  try {
    const stageBucketName = getEnvironmentVariable('STAGE_BUCKET_NAME');
    logger.info('Copying from raw to stage', { event, stageBucketName });

    const records = getS3EventRecords(event);
    return await Promise.all(
      records.map(async record => {
        logger.info('Starting raw to stage copy', { record });
        const datasource = await getDatasource(record, logger);
        if (!datasource.ingestion_enabled_status) {
          logger.warn('Ingestion not enabled for datasource');
          return { filename: record.s3.object.key, status: 'cancelled' };
        }
        return await copyFileToStaging(record, stageBucketName);
      }),
    );
  } catch (error) {
    logger.error('Error copying raw to stage', { error });
    throw error;
  }
};

const copyFileToStaging = async (record: S3EventRecord, stageBucketName: string): Promise<S3RawToStageResult> => {
  const rawBucketName = record.s3.bucket.name;
  const filename = record.s3.object.key;

  try {
    return await s3Client
      .send(
        new CopyObjectCommand({
          Bucket: stageBucketName,
          CopySource: `${rawBucketName}/${filename}`,
          Key: filename,
        }),
      )
      .then(response => ({ filename, status: 'succeeded' }));
  } catch (error) {
    logger.error('Error copying file from raw to stage', { error });
    return { filename, status: 'failed', error: getErrorMessage(error) };
  }
};
