import { mockClient } from 'aws-sdk-client-mock';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { handler } from './handler';
import * as child_process from 'node:child_process';
import { getTestResource } from '../../shared/utils/test-utils';
import * as fs from 'node:fs';
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import * as path from 'node:path';
import * as tar from 'tar';

const mockS3Client = mockClient(S3Client);
const mockSecretsManagerClient = mockClient(SecretsManagerClient);

const DATABASE = 'dap_txma_reporting_db';

const SECRET_ID = 'MySecretId';

const FLYWAY_FILES_BUCKET_NAME = 'flyway-files-bucket';

// this is of type RedshiftSecret but we can't use type annotations in this file (see further explanation above jest.mock call)
const SECRET_VALUE = {
  engine: 'redshift',
  host: 'host',
  username: 'admin',
  password: `password`,
  dbname: 'dbname',
  port: '5439',
};

// event is of type RunFlywayEvent but we can't use type annotations in this file (see further explanation above jest.mock call)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectedEnvironment = (event: { database: string }, cleanDisabled: boolean = false): any => {
  return expect.objectContaining({
    FLYWAY_URL: `jdbc:redshift://${SECRET_VALUE.host}:${SECRET_VALUE.port}/dap_txma_reporting_db`,
    FLYWAY_USER: SECRET_VALUE.username,
    FLYWAY_PASSWORD: SECRET_VALUE.password,
    FLYWAY_LOCATIONS: `filesystem:/tmp/flyway/migrations/${event.database}`,
    FLYWAY_CONFIG_FILES: '/tmp/flyway/flyway.conf',
    FLYWAY_CLEAN_DISABLED: cleanDisabled.toString(),
  });
};

const LIBRARY_FILES_PATH = '/tmp/flyway/lib';

const FLYWAY_TAR_NAME = 'flyway-commandline-10.7.2-linux-x64.tar.gz';

const REDSHIFT_JAR_NAME = 'redshift-jdbc42-2.1.0.25.jar';

// this is of type RunFlywayEvent but we can't use type annotations in this file (see further explanation above jest.mock call)
const TEST_EVENT = { command: 'info', database: DATABASE };

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

jest.mock('node:fs', () => {
  return {
    __esModule: true,
    ...jest.requireActual('node:fs'),
  };
});

const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');
const createWriteStreamSpy = jest.spyOn(fs, 'createWriteStream');
const readdirSyncSpy = jest.spyOn(fs, 'readdirSync');
const renameSyncSpy = jest.spyOn(fs, 'renameSync');
const existsSyncSpy = jest.spyOn(fs, 'existsSync');

jest.mock('node:path', () => {
  return {
    __esModule: true,
    ...jest.requireActual('node:path'),
  };
});

const parseSpy = jest.spyOn(path, 'parse');

jest.mock('tar', () => {
  return {
    __esModule: true,
    ...jest.requireActual('tar'),
  };
});

const tarExtractSpy = jest.spyOn(tar, 'x');

let FLYWAY_CONNECTION_ERROR: Record<string, unknown>;

let FLYWAY_INFO: Record<string, unknown>;

beforeAll(async () => {
  FLYWAY_CONNECTION_ERROR = JSON.parse(await getTestResource('flyway-connection-error.json'));
  FLYWAY_INFO = JSON.parse(await getTestResource('flyway-info.json'));
  mkdirSyncSpy.mockImplementation();
  createWriteStreamSpy.mockImplementation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readdirSyncSpy.mockReturnValue([FLYWAY_TAR_NAME, REDSHIFT_JAR_NAME] as any);
  parseSpy.mockImplementation(
    path =>
      ({
        base: path.substring(path.lastIndexOf('/') + 1),
        dir: path.substring(0, path.lastIndexOf('/')),
      }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );
  tarExtractSpy.mockImplementation(options => {
    expect(options.file).toEqual(`${LIBRARY_FILES_PATH}/${FLYWAY_TAR_NAME}`);
    expect(options.stripComponents).toEqual(1);
    expect(options.C).toEqual(LIBRARY_FILES_PATH);
  });
  renameSyncSpy.mockImplementation((oldPath, newPath) => {
    expect(oldPath).toEqual(`${LIBRARY_FILES_PATH}/${REDSHIFT_JAR_NAME}`);
    expect(newPath).toEqual(`${LIBRARY_FILES_PATH}/drivers/${REDSHIFT_JAR_NAME}`);
  });
});

beforeEach(() => {
  mockS3Client.reset();
  mockS3Client.callsFake(input => {
    throw new Error(`Unexpected S3 request - ${JSON.stringify(input)}`);
  });

  mockSecretsManagerClient.reset();
  mockSecretsManagerClient.callsFake(input => {
    throw new Error(`Unexpected Secrets Manager request - ${JSON.stringify(input)}`);
  });

  mkdirSyncSpy.mockReset();

  process.env.REDSHIFT_SECRET_ID = SECRET_ID;
  process.env.FLYWAY_FILES_BUCKET_NAME = FLYWAY_FILES_BUCKET_NAME;
});

test('unknown command', async () => {
  await expect(handler({ command: 'NotACommand', database: DATABASE })).rejects.toThrow(
    'Unknown command "NotACommand"',
  );
});

test('error getting files', async () => {
  const errorMessage = 's3 error';

  mockS3Responses({ errorMessage });
  mockSecretsManagerResponses();

  await expect(handler(TEST_EVENT)).rejects.toThrow(`Error getting flyway files - ${errorMessage}`);

  expect(mockS3Client.calls()).toHaveLength(1);
  expect(mockSecretsManagerClient.calls()).toHaveLength(0);
});

test('error getting secret', async () => {
  const errorMessage = 'secretsmanager error';

  mockS3Responses();
  mockSecretsManagerResponses(errorMessage);

  await expect(handler(TEST_EVENT)).rejects.toThrow(
    `Error getting redshift secret - Error getting secret - ${errorMessage}`,
  );

  expect(mockS3Client.calls()).toHaveLength(4);
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('flyway success', async () => {
  mockS3Responses();
  mockSecretsManagerResponses();

  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(expectedEnvironment(TEST_EVENT));
    return spawnSyncResult(0, FLYWAY_INFO, {});
  });

  const response = await handler(TEST_EVENT);
  expect(response.status).toEqual(0);
  expect(response.stderr).toEqual({});
  expect(response.stdout).toEqual(FLYWAY_INFO);
  expect(response.error).toBeUndefined();

  expect(mockS3Client.calls()).toHaveLength(4);
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('flyway error', async () => {
  mockS3Responses();
  mockSecretsManagerResponses();

  // flyway sends errors using stdout
  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(expectedEnvironment(TEST_EVENT));
    return spawnSyncResult(1, FLYWAY_CONNECTION_ERROR, {});
  });

  const response = await handler(TEST_EVENT);
  expect(response.status).toEqual(1);
  expect(response.stderr).toEqual({});
  expect(response.stdout).toEqual(FLYWAY_CONNECTION_ERROR);
  expect(response.error).toBeUndefined();

  expect(mockS3Client.calls()).toHaveLength(4);
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('spawn sync error', async () => {
  const error = new Error('Command line error');
  const stderr = { error: 'spawn sync error' };

  mockS3Responses();
  mockSecretsManagerResponses();

  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(expectedEnvironment(TEST_EVENT));
    return spawnSyncResult(1, {}, stderr, error);
  });

  const response = await handler(TEST_EVENT);
  expect(response.status).toEqual(1);
  expect(response.stderr).toEqual(stderr);
  expect(response.stdout).toEqual({});
  expect(response.error).toEqual(error);

  expect(mockS3Client.calls()).toHaveLength(4);
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('spawn sync uncaught error', async () => {
  const error = new Error('Command line error');

  mockS3Responses();
  mockSecretsManagerResponses();

  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(expectedEnvironment(TEST_EVENT));
    throw error;
  });

  await expect(handler(TEST_EVENT)).rejects.toThrow(error.message);

  expect(mockS3Client.calls()).toHaveLength(4);
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('getting files', async () => {
  const contents = [
    { Key: 'flyway.conf' },
    { Key: 'lib/flyway-commandline-10.7.2-linux-x64.tar.gz' },
    { Key: 'lib/redshift-jdbc42-2.1.0.25.jar' },
    { Key: 'migrations/V1_0__first_migration.sql' },
    { Key: 'migrations/feature-one/V1_1_0__create_tables.sql' },
    { Key: 'migrations/feature-two/V1_2_0__create_tables.sql' },
    { Key: 'migrations/feature-two/V1_2_1__add_views.sql' },
  ];

  mockS3Responses({ contents });
  mockSecretsManagerResponses();

  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(expectedEnvironment(TEST_EVENT));
    return spawnSyncResult(0, FLYWAY_INFO, {});
  });

  // use an array to represent the filesystem so existsSync can be affected by mkdirSync
  const existingFolders: string[] = [];
  mkdirSyncSpy.mockImplementation((path, options) => {
    existingFolders.push(path.toString());
    return undefined;
  });
  existsSyncSpy.mockImplementation(path => existingFolders.includes(path.toString()));

  const response = await handler(TEST_EVENT);
  expect(response.status).toEqual(0);
  expect(response.stderr).toEqual({});
  expect(response.stdout).toEqual(FLYWAY_INFO);
  expect(response.error).toBeUndefined();

  expect(mkdirSyncSpy.mock.calls).toHaveLength(5);
  expect(mkdirSyncSpy.mock.calls).toEqual(
    expect.arrayContaining([
      ['/tmp/flyway', { recursive: true }],
      ['/tmp/flyway/lib', { recursive: true }],
      ['/tmp/flyway/migrations', { recursive: true }],
      ['/tmp/flyway/migrations/feature-one', { recursive: true }],
      ['/tmp/flyway/migrations/feature-two', { recursive: true }],
    ]),
  );

  expect(mockS3Client.calls()).toHaveLength(8);
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('clean enabled in non production environment', async () => {
  process.env.ENVIRONMENT = 'dev';
  await testClean(false);
});

test('clean disabled in production environment', async () => {
  process.env.ENVIRONMENT = 'production';
  await testClean(true);
});

const testClean = async (cleanShouldBeDisabled: boolean): Promise<void> => {
  mockS3Responses();
  mockSecretsManagerResponses();

  const cleanEvent = { ...TEST_EVENT, command: 'clean' };

  spawnSyncSpy.mockImplementation((command, args, options) => {
    expect(options?.env).toEqual(expectedEnvironment(cleanEvent, cleanShouldBeDisabled));
    return spawnSyncResult(0, {}, {});
  });

  const response = await handler(cleanEvent);
  expect(response.status).toEqual(0);
  expect(response.stderr).toEqual({});
  expect(response.stdout).toEqual({});
  expect(response.error).toBeUndefined();

  expect(mockS3Client.calls()).toHaveLength(4);
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
};

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

class MockReadable extends Readable {
  pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean | undefined }): T {
    // @ts-expect-error this is fine as it's just for creating a mock
    return this;
  }

  // @ts-expect-error this is fine as it's just for creating a mock
  on(event: string, listener: () => void): this {
    if (event === 'close') {
      listener();
    }
    return this;
  }
}

// the Body properties below need an 'as SdkStream<Readable>' but we can't use type annotations in this file (see further explanation above jest.mock call)
const mockS3Responses = (config?: { errorMessage?: string; contents?: Array<{ Key: string }> }): void => {
  const contents = config?.contents ?? [
    { Key: 'flyway.conf' },
    { Key: 'migrations/V1_0__first_migration.sql' },
    { Key: 'migrations/V1_1__second_migration.sql' },
  ];

  if (config?.errorMessage !== undefined) {
    mockS3Client.onAnyCommand().rejects(config.errorMessage);
    return;
  }
  mockS3Client.on(ListObjectsV2Command, { Bucket: FLYWAY_FILES_BUCKET_NAME }).resolvesOnce({ Contents: contents });

  contents.forEach(({ Key }) => {
    mockS3Client
      .on(GetObjectCommand, { Bucket: FLYWAY_FILES_BUCKET_NAME, Key })
      .resolvesOnce({ Body: new MockReadable() as never });
  });
};

const mockSecretsManagerResponses = (errorMessage?: string): void => {
  if (errorMessage !== undefined) {
    mockSecretsManagerClient.onAnyCommand().rejects(errorMessage);
    return;
  }
  mockSecretsManagerClient
    .on(GetSecretValueCommand, { SecretId: SECRET_ID })
    .resolvesOnce({ SecretString: JSON.stringify(SECRET_VALUE) });
};
