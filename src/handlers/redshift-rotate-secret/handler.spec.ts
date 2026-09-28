import { mockClient } from 'aws-sdk-client-mock';
import {
  DescribeSecretCommand,
  GetRandomPasswordCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
  UpdateSecretVersionStageCommand,
} from '@aws-sdk/client-secrets-manager';
import { databaseAccess, handler } from './handler';
import type { RotateSecretStep } from './handler';
import type { RedshiftSecret, SecretRotationStage } from '../../shared/types/secrets-manager';
import type { Database } from './database-access';
import { DatabaseAccess } from './database-access';
import type { Knex } from 'knex';

const mockSecretsManagerClient = mockClient(SecretsManagerClient);

const CLIENT_REQUEST_TOKEN = 'token';

const PASSWORD_EXCLUDE_CHARS = `"''@/\\`;

const PASSWORD_LENGTH = '16';

const SECRET_ID = 'MySecretId';

const getDatabaseConnectionSpy = vi.spyOn(databaseAccess, 'getDatabaseConnection');

interface SecretsManagerMockingConfig {
  pendingSecretError?: boolean;
  versions?: Record<string, string[]>;
}

interface DatabaseConnectionMockingConfig {
  connection: boolean;
  rawError?: string;
}

beforeEach(() => {
  getDatabaseConnectionSpy.mockReset();
  mockSecretsManagerClient.reset();
  mockSecretsManagerClient.callsFake(input => {
    throw new Error(`Unexpected Secrets Manager request - ${JSON.stringify(input)}`);
  });

  process.env.PASSWORD_EXCLUDE_CHARS = PASSWORD_EXCLUDE_CHARS;
  process.env.PASSWORD_LENGTH = PASSWORD_LENGTH;
});

test('no stage for rotation', async () => {
  // Unit Test
  mockSecretsManager({ versions: { someVersion: ['AWSPENDING'] } });

  await expect(
    handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('Secret version has no stage for rotation');

  // describeSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('empty stage array for rotation', async () => {
  // Unit Test - covers the `version.length === 0` branch (line 77)
  mockSecretsManager({ versions: { [CLIENT_REQUEST_TOKEN]: [] } });

  await expect(
    handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('Secret version has no stage for rotation');

  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('invalid step', async () => {
  // Unit Test
  mockSecretsManager();

  await expect(
    handler({
      Step: 'invalid' as unknown as RotateSecretStep,
      SecretId: SECRET_ID,
      ClientRequestToken: CLIENT_REQUEST_TOKEN,
    }),
  ).rejects.toThrow('Invalid step parameter');

  // describeSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('create secret pending already created', async () => {
  // Unit Test
  mockSecretsManager();

  await handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('create secret create pending', async () => {
  // Unit Test
  mockSecretsManager({ pendingSecretError: true });

  await handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret, getSecret, getRandomPassword, putSecretValue
  expect(mockSecretsManagerClient.calls()).toHaveLength(5);
});

test('set secret pending already set', async () => {
  // Unit Test
  mockSecretsManager();
  mockDatabaseConnections({ AWSPENDING: { connection: true } });

  await handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('set secret current works', async () => {
  // Unit Test
  mockSecretsManager();
  mockDatabaseConnections({ AWSCURRENT: { connection: true } });

  await handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(3);
});

test('set secret previous works', async () => {
  // Unit Test
  mockSecretsManager();
  mockDatabaseConnections({ AWSPREVIOUS: { connection: true } });

  await handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret, getSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(4);
});

test('set secret none works', async () => {
  // Unit Test
  mockSecretsManager();
  mockDatabaseConnections({});

  await expect(
    handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('setSecret: Unable to log into database with previous, current, or pending secret');

  // describeSecret, getSecret, getSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(4);
});

test('set secret error changing password', async () => {
  // Unit Test
  const errorMessage = 'error setting password';
  mockSecretsManager();
  mockDatabaseConnections({ AWSCURRENT: { connection: true, rawError: errorMessage } });

  await expect(
    handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('setSecret: Error changing database password');

  // describeSecret, getSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(3);
});

test('secret success', async () => {
  // Unit Test
  mockSecretsManager();
  mockDatabaseConnections({ AWSPENDING: { connection: true } });

  await handler({ Step: 'testSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('secret bad secret', async () => {
  // Unit Test
  mockSecretsManager({ pendingSecretError: true });
  mockDatabaseConnections({ AWSPENDING: { connection: true } });

  await expect(
    handler({ Step: 'testSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('Error getting secret - pending secret error');

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('secret bad connection', async () => {
  // Unit Test
  mockSecretsManager();
  mockDatabaseConnections({});

  await expect(
    handler({ Step: 'testSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('testSecret: Unable to log into database with pending secret');

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('finish secret already marked as current', async () => {
  // Unit Test
  mockSecretsManager({ versions: { [CLIENT_REQUEST_TOKEN]: ['AWSCURRENT'] } });

  await handler({ Step: 'finishSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('finish secret current version exists but is not this one', async () => {
  // Unit Test
  mockSecretsManager({ versions: { [CLIENT_REQUEST_TOKEN]: ['AWSPENDING'], randomVersionId: ['AWSCURRENT'] } });

  await handler({ Step: 'finishSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, updateSecretVersionStage
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('finish secret no current version', async () => {
  // Unit Test
  mockSecretsManager();

  await handler({ Step: 'finishSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, updateSecretVersionStage
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('describeSecret non-Error thrown', async () => {
  // Unit Test - covers the `error instanceof Error ? ... : 'Unknown error'` false branch in describeSecret catch
  const clients = await import('../../shared/clients');
  const sendSpy = vi.spyOn(clients.secretsManagerClient, 'send').mockRejectedValueOnce({ code: 'NOT_AN_ERROR' });

  await expect(
    handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('Error getting secret metadata');

  sendSpy.mockRestore();
});

test('getRandomPassword non-Error thrown', async () => {
  // Unit Test - covers the `error instanceof Error ? ... : 'Unknown error'` false branch in getRandomPassword catch
  // Call sequence with pendingSecretError: 1=DescribeSecret, 2=GetSecretValue(AWSPENDING→throws),
  // 3=GetSecretValue(AWSCURRENT), 4=GetRandomPassword
  mockSecretsManager({ pendingSecretError: true });
  const clients = await import('../../shared/clients');
  let callCount = 0;
  const sendSpy = vi.spyOn(clients.secretsManagerClient, 'send').mockImplementation(async (...args) => {
    callCount++;
    if (callCount >= 4) throw { code: 'NOT_AN_ERROR' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mockSecretsManagerClient.send(...(args as [any])) as any;
  });

  await expect(
    handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('Error getting random password');

  sendSpy.mockRestore();
});

test('updateSecretVersionStage non-Error thrown', async () => {
  // Unit Test - covers the `error instanceof Error ? ... : 'Unknown error'` false branch in updateSecretVersionStage catch
  mockSecretsManager();
  const clients = await import('../../shared/clients');
  let callCount = 0;
  const sendSpy = vi.spyOn(clients.secretsManagerClient, 'send').mockImplementation(async (...args) => {
    callCount++;
    if (callCount >= 2) throw { code: 'NOT_AN_ERROR' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mockSecretsManagerClient.send(...(args as [any])) as any;
  });

  await expect(
    handler({ Step: 'finishSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('Error updating secret version stage');

  sendSpy.mockRestore();
});

test('secret to database connection', async () => {
  // Unit Test
  // @ts-expect-error this incorrectly extends DatabaseAccess by overriding a private method but it's fine as it's a test
  const databaseAccess = new (class extends DatabaseAccess {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async validateConnection(connection: Knex<any, unknown[]>): Promise<Knex<any, unknown[]>> {
      return connection;
    }
  })();

  const secret = JSON.parse(getSecretString({ SecretId: 'hello', VersionStage: 'AWSCURRENT' }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connection: any = await databaseAccess.getDatabaseConnection(secret);
  const config = connection.context.client.config;

  expect(config.client).toEqual('pg');
  expect(config.connection).toEqual({
    host: secret.host,
    user: secret.username,
    database: secret.dbname,
    port: parseInt(secret.port, 10),
  });
});

test('getDatabaseConnection non-Error thrown', async () => {
  // Unit Test - covers the `error instanceof Error ? ... : 'Unknown error'` false branch in getDatabaseConnection catch
  // @ts-expect-error overriding private method for test purposes
  const databaseAccess = new (class extends DatabaseAccess {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async validateConnection(_connection: Knex<any, unknown[]>): Promise<Knex<any, unknown[]>> {
      throw { code: 'NOT_AN_ERROR' };
    }
  })();

  const secret = JSON.parse(getSecretString({ SecretId: 'hello', VersionStage: 'AWSCURRENT' }));
  const result = await databaseAccess.getDatabaseConnection(secret);
  expect(result).toBeNull();
});

const mockSecretsManager = (config: SecretsManagerMockingConfig = {}): void => {
  const pendingSecretError = config.pendingSecretError ?? false;
  const versions = config.versions ?? { [CLIENT_REQUEST_TOKEN]: ['AWSPENDING'] };
  mockSecretsManagerClient
    .on(DescribeSecretCommand, { SecretId: SECRET_ID })
    .resolves({ RotationEnabled: true, VersionIdsToStages: versions })
    .on(GetSecretValueCommand, { SecretId: SECRET_ID })
    .callsFake(async (input: { SecretId: string; VersionStage: SecretRotationStage }) => {
      const stage = input.VersionStage;
      if (stage === 'AWSPENDING' && pendingSecretError) {
        throw new Error('pending secret error');
      }
      return { SecretString: getSecretString(input) };
    })
    .on(GetRandomPasswordCommand, {
      PasswordLength: parseInt(PASSWORD_LENGTH),
      ExcludeCharacters: PASSWORD_EXCLUDE_CHARS,
    })
    .resolves({ RandomPassword: 'password123' })
    .on(PutSecretValueCommand, { SecretId: SECRET_ID })
    .resolves({})
    .on(UpdateSecretVersionStageCommand, { SecretId: SECRET_ID, VersionStage: 'AWSCURRENT' })
    .resolves({});
};

const mockDatabaseConnections = (
  configs: Partial<Record<SecretRotationStage, DatabaseConnectionMockingConfig>>,
): void => {
  getDatabaseConnectionSpy.mockImplementation(async (secret: RedshiftSecret) => {
    const stage = secret.password.replace('password-', '') as unknown as SecretRotationStage;
    switch (stage) {
      case 'AWSPENDING':
        return mockConnection(configs.AWSPENDING);
      case 'AWSCURRENT':
        return mockConnection(configs.AWSCURRENT);
      case 'AWSPREVIOUS':
        return mockConnection(configs.AWSPREVIOUS);
    }
  });
};

const mockConnection = (config?: DatabaseConnectionMockingConfig): Database | null => {
  const connection = config?.connection ?? false;
  if (!connection) {
    return null;
  }
  return {
    raw: async (query: string) => {
      const error = config?.rawError;
      if (error !== undefined) {
        await Promise.reject(new Error(error));
      }
      await Promise.resolve();
    },
    destroy: async () => {
      await Promise.resolve();
    },
  };
};

const getSecretString = (input: { SecretId: string; VersionStage: SecretRotationStage }): string => {
  return JSON.stringify({
    engine: 'redshift',
    host: 'host',
    username: 'admin',
    password: `password-${input.VersionStage}`,
    dbname: 'dbname',
    port: '5439',
  });
};
