import type { S3ObjectCreatedNotificationEvent, S3ObjectDeletedNotificationEvent } from 'aws-lambda';
import { getLogger } from '../../shared/powertools';

export const logger = getLogger('lambda/s3-notifications-logger');

export const handler = (event: S3ObjectCreatedNotificationEvent | S3ObjectDeletedNotificationEvent): void => {
  if (event?.detail === null || event?.detail === undefined) {
    logger.error('Missing event or event detail', { event });
    return;
  }

  logger.info(`${event.detail.reason} event for ${event.detail.bucket.name}`, { event });
};
