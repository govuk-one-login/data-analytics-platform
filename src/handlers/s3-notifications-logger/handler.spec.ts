import { handler } from './handler';
import { logger } from '../../shared/logger';
import { getTestResource } from '../../shared/utils/test-utils';
import type { S3ObjectCreatedNotificationEvent } from 'aws-lambda';

vi.mock('../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('create event', async () => {
  // Unit Test
  const event = JSON.parse(await getTestResource('eventbridge-s3-object-creation.json'));

  handler(event);

  expect(logger.info).toHaveBeenCalledTimes(1);
  expect(logger.info).toHaveBeenCalledWith('S3 notification event received', {
    reason: event.detail.reason,
    bucketName: event.detail.bucket.name,
  });
});

test('valid event', async () => {
  // Unit Test
  const event = JSON.parse(await getTestResource('eventbridge-s3-object-deletion.json'));

  handler(event);

  expect(logger.info).toHaveBeenCalledTimes(1);
  expect(logger.info).toHaveBeenCalledWith('S3 notification event received', {
    reason: event.detail.reason,
    bucketName: event.detail.bucket.name,
  });
});

test('invalid event or records', async () => {
  // Unit Test
  handler(null as unknown as S3ObjectCreatedNotificationEvent);
  handler(undefined as unknown as S3ObjectCreatedNotificationEvent);
  handler({} as unknown as S3ObjectCreatedNotificationEvent);
  handler({ detail: null } as unknown as S3ObjectCreatedNotificationEvent);
  handler({ detail: undefined } as unknown as S3ObjectCreatedNotificationEvent);

  expect(logger.error).toHaveBeenCalledTimes(5);
  expect(logger.error).toHaveBeenCalledWith('Missing event or event detail');
});
