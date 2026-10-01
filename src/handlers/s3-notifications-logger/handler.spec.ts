import { handler } from './handler';
import { logger } from '../../shared/logger';
import { getTestResource } from '../../shared/utils/test-utils';
import { ERROR_CODES } from '../../shared/error-codes';
import type { S3ObjectCreatedNotificationEvent } from 'aws-lambda';

vi.mock('../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  initialiseLogger: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('create event', async () => {
  // Unit Test
  const event = JSON.parse(await getTestResource('eventbridge-s3-object-creation.json'));

  handler(event);

  expect(logger.info).toHaveBeenCalledWith('S3 notification event received', {
    correlationId: event.id,
    reason: event.detail.reason,
    bucketName: event.detail.bucket.name,
  });
  expect(logger.info).toHaveBeenCalledWith(
    'S3 notifications logger handler completed',
    expect.objectContaining({ outcome: 'success', duration: expect.any(Number) }),
  );
});

test('valid event', async () => {
  // Unit Test
  const event = JSON.parse(await getTestResource('eventbridge-s3-object-deletion.json'));

  handler(event);

  expect(logger.info).toHaveBeenCalledWith('S3 notification event received', {
    correlationId: event.id,
    reason: event.detail.reason,
    bucketName: event.detail.bucket.name,
  });
  expect(logger.info).toHaveBeenCalledWith(
    'S3 notifications logger handler completed',
    expect.objectContaining({ outcome: 'success', duration: expect.any(Number) }),
  );
});

test('invalid event or records', async () => {
  // Unit Test
  handler(null as unknown as S3ObjectCreatedNotificationEvent);
  handler(undefined as unknown as S3ObjectCreatedNotificationEvent);
  handler({} as unknown as S3ObjectCreatedNotificationEvent);
  handler({ detail: null } as unknown as S3ObjectCreatedNotificationEvent);
  handler({ detail: undefined } as unknown as S3ObjectCreatedNotificationEvent);

  expect(logger.error).toHaveBeenCalledTimes(5);
  expect(logger.error).toHaveBeenCalledWith(
    'Missing event or event detail',
    expect.objectContaining({
      error: expect.objectContaining({ code: ERROR_CODES.MISSING_EVENT_DETAIL }),
    }),
  );
});
