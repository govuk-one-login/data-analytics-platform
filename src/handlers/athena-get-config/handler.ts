import { buildErrorMetadata, getRequiredParams, parseS3ResponseAsObject } from '../../shared/utils/utils';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../shared/clients';
import type { AthenaGetConfigEvent, RawLayerEventStatus } from '../../shared/types/raw-layer-processing';
import { logger, initialiseLogger } from '../../shared/logger';
import { ERROR_CODES } from '../../shared/error-codes';
import type { Context } from 'aws-lambda';

export const handler = async (event: AthenaGetConfigEvent, context?: Context): Promise<RawLayerEventStatus[]> => {
  if (context !== undefined) {
    initialiseLogger(context);
  }
  const startTime = Date.now();
  const correlationId = context?.awsRequestId;
  logger.info('Handler started', { correlationId, datasource: event.datasource });

  try {
    const {
      datasource,
      S3MetaDataBucketName: Bucket,
      configFilePrefix,
    } = getRequiredParams(event, 'datasource', 'S3MetaDataBucketName', 'configFilePrefix');
    const request = new GetObjectCommand({
      Bucket,
      Key: `${datasource}/process_config/${configFilePrefix}_config.json`,
    });

    logger.info('Getting athena config', { correlationId, bucket: Bucket, datasource });
    const response = await s3Client.send(request);
    const config = await parseS3ResponseAsObject<RawLayerEventStatus[]>(response);
    logger.info('Handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
    });
    return config;
  } catch (error) {
    logger.error('Error getting athena config', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.GET_CONFIG_FAILED),
    });
    throw error;
  }
};
