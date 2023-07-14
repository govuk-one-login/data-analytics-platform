import { handler, logger } from './handler';
import { getTestResource } from '../../shared/utils/test-utils';
import type { S3Event } from 'aws-lambda';

const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

beforeEach(() => {
  loggerInfoSpy.mockReset();
  loggerErrorSpy.mockReset();
});

test('valid event', async () => {
  const s3Event = JSON.parse(await getTestResource('s3-notification-example.json'));

  handler(s3Event);

  expect(loggerInfoSpy).toHaveBeenCalledTimes(2);
  expect(loggerInfoSpy).toHaveBeenCalledWith('ObjectRemoved:Delete event for s3-bucket-name', {
    record: s3Event.Records[0],
  });
  expect(loggerInfoSpy).toHaveBeenCalledWith('ObjectCreated:Put event for s3-bucket-name', {
    record: s3Event.Records[1],
  });
});

test('invalid event or records', async () => {
  handler(null as unknown as S3Event);
  handler(undefined as unknown as S3Event);
  handler({} as unknown as S3Event);
  handler({ Records: null } as unknown as S3Event);
  handler({ Records: undefined } as unknown as S3Event);
  handler({ Records: [] } as unknown as S3Event);

  expect(loggerErrorSpy).toHaveBeenCalledTimes(6);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or records', { event: null });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or records', { event: undefined });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or records', { event: {} });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or records', { event: { Records: null } });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or records', { event: { Records: undefined } });
  expect(loggerErrorSpy).toHaveBeenCalledWith('Missing event or records', { event: { Records: [] } });
});
