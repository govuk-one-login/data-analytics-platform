import { mockClient } from 'aws-sdk-client-mock';
import { CreateSnapshotCommand, RedshiftServerlessClient } from '@aws-sdk/client-redshift-serverless';
import { handler, logger } from './handler';

const NAMESPACE_NAME = 'test-redshift-serverless-ns';
const RETENTION_PERIOD_DAYS = 7;

const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

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
  const epochTime = Date.now();
  jest.useFakeTimers().setSystemTime(epochTime);

  const response = { snapshot: { namespaceName: 'name', namespaceArn: 'arn' } };

  // indirectly assert that the snapshot name is correct as if it is not the on() will not match
  mockRedshiftServerlessClient
    .on(CreateSnapshotCommand, {
      namespaceName: NAMESPACE_NAME,
      retentionPeriod: RETENTION_PERIOD_DAYS,
      snapshotName: `snapshot-${epochTime}`,
    })
    .resolvesOnce(response);

  await handler();

  expect(mockRedshiftServerlessClient.calls()).toHaveLength(1);
  expect(loggerInfoSpy).toHaveBeenCalledTimes(1);
  expect(loggerInfoSpy).toHaveBeenCalledWith('Snapshot creation initiated', { response });
  expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
});

test('redshift error', async () => {
  const epochTime = Date.now();
  jest.useFakeTimers().setSystemTime(epochTime);

  const error = 'redshift error';

  // indirectly assert that the snapshot name is correct as if it is not the on() will not match
  mockRedshiftServerlessClient
    .on(CreateSnapshotCommand, {
      namespaceName: NAMESPACE_NAME,
      retentionPeriod: RETENTION_PERIOD_DAYS,
      snapshotName: `snapshot-${epochTime}`,
    })
    .rejectsOnce(error);

  await expect(handler()).rejects.toThrow(error);

  expect(mockRedshiftServerlessClient.calls()).toHaveLength(1);
  expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Error creating redshift snapshot', { error: new Error(error) });
});
