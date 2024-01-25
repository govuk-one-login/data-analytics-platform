import { mockClient } from 'aws-sdk-client-mock';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { handler } from './handler';
import * as child_process from 'node:child_process';
import { getTestResource } from '../../shared/utils/test-utils';

const mockSecretsManagerClient = mockClient(SecretsManagerClient);

const SECRET_ID = 'MySecretId';

// this is of type RedshiftSecret but we can't use type annotations in this file (see further explanation above jest.mock call)
const SECRET_VALUE = {
  engine: 'redshift',
  host: 'host',
  username: 'admin',
  password: `password`,
  dbname: 'dbname',
  port: '5439',
};

const EXPECTED_ENVIRONMENT = expect.objectContaining({
  FLYWAY_URL: `jdbc:redshift://${SECRET_VALUE.host}:${SECRET_VALUE.port}/dap_txma_reporting_db`,
  FLYWAY_USER: SECRET_VALUE.username,
  FLYWAY_PASSWORD: SECRET_VALUE.password,
});

/*
  because we use jest mocking in this test file, esbuild-jest transforms the file differently
  such that it can no longer have type annotations (e.g. this function should return child_process.SpawnSyncReturns<Buffer>)
  see https://github.com/aelbore/esbuild-jest/issues/57
 */
jest.mock('node:child_process', () => {
  return {
    __esModule: true,
    ...jest.requireActual('node:child_process'),
  };
});

const spawnSyncSpy = jest.spyOn(child_process, 'spawnSync');

let FLYWAY_CONNECTION_ERROR: Record<string, unknown>;

let FLYWAY_INFO: Record<string, unknown>;

beforeAll(async () => {
  FLYWAY_CONNECTION_ERROR = JSON.parse(await getTestResource('flyway-connection-error.json'));
  FLYWAY_INFO = JSON.parse(await getTestResource('flyway-info.json'));
});

beforeEach(() => {
  mockSecretsManagerClient.reset();
  mockSecretsManagerClient.callsFake(input => {
    throw new Error(`Unexpected Secrets Manager request - ${JSON.stringify(input)}`);
  });

  process.env.REDSHIFT_SECRET_ID = SECRET_ID;
});

test('unknown command', async () => {
  await expect(handler({ command: 'NotACommand' })).rejects.toThrow('Unknown command "NotACommand"');
});

test('error getting secret', async () => {
  const errorMessage = 'secretsmanager error';

  mockSecretsManagerClient.on(GetSecretValueCommand, { SecretId: SECRET_ID }).rejectsOnce(errorMessage);

  await expect(handler({ command: 'info' })).rejects.toThrow(
    `Error getting redshift secret - Error getting secret - ${errorMessage}`,
  );

  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('flyway success', async () => {
  mockSecretsManagerClient
    .on(GetSecretValueCommand, { SecretId: SECRET_ID })
    .resolvesOnce({ SecretString: JSON.stringify(SECRET_VALUE) });

  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(EXPECTED_ENVIRONMENT);
    return spawnSyncResult(1, FLYWAY_INFO, {});
  });

  const response = await handler({ command: 'info' });
  expect(response.status).toEqual(1);
  expect(response.stderr).toEqual({});
  expect(response.stdout).toEqual(FLYWAY_INFO);
  expect(response.error).toBeUndefined();
});

test('flyway error', async () => {
  mockSecretsManagerClient
    .on(GetSecretValueCommand, { SecretId: SECRET_ID })
    .resolvesOnce({ SecretString: JSON.stringify(SECRET_VALUE) });

  // flyway sends errors using stdout
  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(EXPECTED_ENVIRONMENT);
    return spawnSyncResult(1, FLYWAY_CONNECTION_ERROR, {});
  });

  const response = await handler({ command: 'info' });
  expect(response.status).toEqual(1);
  expect(response.stderr).toEqual({});
  expect(response.stdout).toEqual(FLYWAY_CONNECTION_ERROR);
  expect(response.error).toBeUndefined();
});

test('spawn sync error', async () => {
  const error = new Error('Command line error');
  const stderr = { error: 'spawn sync error' };

  mockSecretsManagerClient
    .on(GetSecretValueCommand, { SecretId: SECRET_ID })
    .resolvesOnce({ SecretString: JSON.stringify(SECRET_VALUE) });

  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(EXPECTED_ENVIRONMENT);
    return spawnSyncResult(1, {}, stderr, error);
  });

  const response = await handler({ command: 'info' });
  expect(response.status).toEqual(1);
  expect(response.stderr).toEqual(stderr);
  expect(response.stdout).toEqual({});
  expect(response.error).toEqual(error);
});

test('spawn sync uncaught error', async () => {
  const error = new Error('Command line error');

  mockSecretsManagerClient
    .on(GetSecretValueCommand, { SecretId: SECRET_ID })
    .resolvesOnce({ SecretString: JSON.stringify(SECRET_VALUE) });

  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(EXPECTED_ENVIRONMENT);
    throw error;
  });

  await expect(handler({ command: 'info' })).rejects.toThrow(error.message);
});

// this should return type child_process.SpawnSyncReturns<Buffer> but we can't use type annotations in this file (see further explanation above jest.mock call)
const spawnSyncResult = (
  status: number,
  stdout: Record<string, unknown>,
  stderr: Record<string, unknown>,
  error?: Error,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  return {
    status,
    stdout: Buffer.from(JSON.stringify(stdout), 'utf-8'),
    stderr: Buffer.from(JSON.stringify(stderr), 'utf-8'),
    error,
  };
};
