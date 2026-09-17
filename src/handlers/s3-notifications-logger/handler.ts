import type { S3ObjectCreatedNotificationEvent, S3ObjectDeletedNotificationEvent } from 'aws-lambda';
import { logger } from '../../shared/logger';

export const handler = (event: S3ObjectCreatedNotificationEvent | S3ObjectDeletedNotificationEvent): void => {
  if (event?.detail === null || event?.detail === undefined) {
    logger.error('Missing event or event detail');
    return;
  }

  logger.info('S3 notification event received', {
    reason: event.detail.reason,
    bucketName: event.detail.bucket.name,
  });
};
