import type { Context, S3ObjectCreatedNotificationEvent, S3ObjectDeletedNotificationEvent } from 'aws-lambda';
import { logger, initialiseLogger } from '../../shared/logger';
import { buildErrorMetadata } from '../../shared/utils/utils';
import { ERROR_CODES } from '../../shared/error-codes';

export const handler = (
  event: S3ObjectCreatedNotificationEvent | S3ObjectDeletedNotificationEvent,
  context: Context,
): void => {
  initialiseLogger(context);
  const startTime = Date.now();
  const correlationId = event?.id;
  logger.info('Handler started', { correlationId });

  if (event?.detail === null || event?.detail === undefined) {
    logger.error('Missing event or event detail', {
      correlationId,
      error: buildErrorMetadata(new Error('Missing event or event detail'), ERROR_CODES.MISSING_EVENT_DETAIL),
    });
    logger.info('Handler completed', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
    });
    return;
  }

  logger.info('S3 notification event received', {
    correlationId,
    reason: event.detail.reason,
    bucketName: event.detail.bucket.name,
  });

  logger.info('Handler completed', {
    correlationId,
    outcome: 'success',
    duration: Date.now() - startTime,
  });
};
