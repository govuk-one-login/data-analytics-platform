import { getRequiredParams, parseS3ResponseAsObject } from '../../shared/utils/utils';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../shared/clients';
import type { AthenaGetConfigEvent, RawLayerEventStatus } from '../../shared/types/raw-layer-processing';
import { getLogger } from '../../shared/powertools';

const logger = getLogger('lambda/athena-get-config');

export const handler = async (event: AthenaGetConfigEvent): Promise<RawLayerEventStatus[]> => {
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

    logger.info('Getting athena config', { input: request.input });
    const response = await s3Client.send(request);
    return await parseS3ResponseAsObject(response);
  } catch (error) {
    logger.error('Error getting athena config', { error });
    throw error;
  }
};
