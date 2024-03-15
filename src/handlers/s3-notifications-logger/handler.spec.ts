import { handler, logger } from './handler';
import { getTestResource } from '../../shared/utils/test-utils';
import type { S3ObjectCreatedNotificationEvent } from 'aws-lambda';

const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

beforeEach(() => {
  loggerInfoSpy.mockReset();
  loggerErrorSpy.mockReset();
});

test('create event', async () => {
  const event = JSON.parse(await getTestResource('eventbridge-s3-object-creation.json'));

  handler(event);

  expect(loggerInfoSpy).toHaveBeenCalledTimes(1);
  expect(loggerInfoSpy).toHaveBeenCalledWith('PutObject event for s3-bucket-name', { event });
});

test('valid event', async () => {
  const event = JSON.parse(await getTestResource('eventbridge-s3-object-deletion.json'));

  handler(event);

  expect(loggerInfoSpy).toHaveBeenCalledTimes(1);
  expect(loggerInfoSpy).toHaveBeenCalledWith('DeleteObject event for s3-bucket-name', { event });
});

test('invalid event or records', async () => {
  handler(null as unknown as S3ObjectCreatedNotificationEvent);
  handler(undefined as unknown as S3ObjectCreatedNotificationEvent);
  handler({} as unknown as S3ObjectCreatedNotificationEvent);
  handler({ detail: null } as unknown as S3ObjectCreatedNotificationEvent);
  handler({ detail: undefined } as unknown as S3ObjectCreatedNotificationEvent);

  expect(loggerErrorSpy).toHaveBeenCalledTimes(5);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or event detail', { event: null });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or event detail', { event: undefined });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or event detail', { event: {} });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or event detail', { event: { detail: null } });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or event detail', { event: { detail: undefined } });
});
