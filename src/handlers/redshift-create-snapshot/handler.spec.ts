import { mockClient } from 'aws-sdk-client-mock';
import { CreateSnapshotCommand, RedshiftServerlessClient } from '@aws-sdk/client-redshift-serverless';
import { handler, logger } from './handler';
import { mockLambdaContext } from '../../shared/utils/test-utils';
import { ERROR_CODES } from '../../shared/error-codes';

const NAMESPACE_NAME = 'test-redshift-serverless-ns';
const RETENTION_PERIOD_DAYS = 7;

const loggerInfoSpy = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

const mockRedshiftServerlessClient = mockClient(RedshiftServerlessClient);

beforeEach(() => {
  loggerInfoSpy.mockReset();
  loggerErrorSpy.mockReset();

  mockRedshiftServerlessClient.reset();
  mockRedshiftServerlessClient.callsFake(input => {
    throw new Error(`Unexpected Redshift Serverless request - ${JSON.stringify(input)}`);
  });

  process.env.NAMESPACE_NAME = NAMESPACE_NAME;
  process.env.RETENTION_PERIOD_DAYS = RETENTION_PERIOD_DAYS.toString(10);
});

test('success', async () => {
  // Unit Test
  const epochTime = Date.now();
  vi.useFakeTimers().setSystemTime(epochTime);

  const response = { snapshot: { namespaceName: 'name', namespaceArn: 'arn' } };

  // indirectly assert that the snapshot name is correct as if it is not the on() will not match
  mockRedshiftServerlessClient
    .on(CreateSnapshotCommand, {
      namespaceName: NAMESPACE_NAME,
      retentionPeriod: RETENTION_PERIOD_DAYS,
      snapshotName: `snapshot-${epochTime}`,
    })
    .resolvesOnce(response);

  await handler({}, mockLambdaContext);

  expect(mockRedshiftServerlessClient.calls()).toHaveLength(1);
  expect(loggerInfoSpy).toHaveBeenCalledWith('Snapshot creation initiated', {
    correlationId: mockLambdaContext.awsRequestId,
    snapshotName: response.snapshot?.snapshotName,
    status: response.snapshot?.status,
  });
  expect(loggerInfoSpy).toHaveBeenCalledWith(
    'Redshift create snapshot handler completed',
    expect.objectContaining({ outcome: 'success', duration: expect.any(Number) }),
  );
  expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
});

test('redshift error', async () => {
  // Unit Test
  const epochTime = Date.now();
  vi.useFakeTimers().setSystemTime(epochTime);

  const error = 'redshift error';

  // indirectly assert that the snapshot name is correct as if it is not the on() will not match
  mockRedshiftServerlessClient
    .on(CreateSnapshotCommand, {
      namespaceName: NAMESPACE_NAME,
      retentionPeriod: RETENTION_PERIOD_DAYS,
      snapshotName: `snapshot-${epochTime}`,
    })
    .rejectsOnce(error);

  await expect(handler({}, mockLambdaContext)).rejects.toThrow(error);

  expect(mockRedshiftServerlessClient.calls()).toHaveLength(1);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
  expect(loggerErrorSpy).toHaveBeenCalledWith(
    'Error creating redshift snapshot',
    expect.objectContaining({
      outcome: 'failure',
      duration: expect.any(Number),
      error: expect.objectContaining({ message: error, code: ERROR_CODES.CREATE_SNAPSHOT_FAILED }),
    }),
  );
});

test('non-Error thrown', async () => {
  // Unit Test - covers the `error instanceof Error ? ... : 'Unknown error'` false branch in the catch block
  // aws-sdk-client-mock always wraps rejects() in an Error, so we spy on send directly
  const { RedshiftServerlessClient } = await import('@aws-sdk/client-redshift-serverless');
  const sendSpy = vi.spyOn(RedshiftServerlessClient.prototype, 'send').mockRejectedValueOnce({ code: 'NOT_AN_ERROR' });

  await expect(handler({}, mockLambdaContext)).rejects.toMatchObject({ code: 'NOT_AN_ERROR' });
  sendSpy.mockRestore();

  expect(loggerErrorSpy).toHaveBeenCalledWith(
    'Error creating redshift snapshot',
    expect.objectContaining({
      error: expect.objectContaining({ message: 'Unknown error', name: 'UnknownError' }),
    }),
  );
});
