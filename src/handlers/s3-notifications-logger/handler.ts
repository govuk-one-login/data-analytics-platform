import type { S3Event } from 'aws-lambda';
import { getLogger } from '../../shared/powertools';
import { isNullUndefinedOrEmpty } from '../../shared/utils/utils';

export const logger = getLogger('lambda/s3-notifications-logger');

export const handler = (event: S3Event): void => {
  if (isNullUndefinedOrEmpty(event?.Records)) {
    logger.error('Missing event or records', { event });
    return;
  }

  event.Records.forEach(record => {
    logger.info(`${record.eventName} event for ${record.s3.bucket.name}`, { record });
  });
};
