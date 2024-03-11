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
import { getLogger } from '../../shared/powertools';
import type { Knex } from 'knex';

const mockSecretsManagerClient = mockClient(SecretsManagerClient);

const CLIENT_REQUEST_TOKEN = 'token';

const PASSWORD_EXCLUDE_CHARS = `"''@/\\`;

const PASSWORD_LENGTH = '16';

const SECRET_ID = 'MySecretId';

const getDatabaseConnectionSpy = jest.spyOn(databaseAccess, 'getDatabaseConnection');

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
  mockSecretsManager({ versions: { someVersion: ['AWSPENDING'] } });

  await expect(
    handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow(`Secret version ${CLIENT_REQUEST_TOKEN} has no stage for rotation`);

  // describeSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('invalid step', async () => {
  mockSecretsManager();

  await expect(
    handler({
      Step: 'invalid' as unknown as RotateSecretStep,
      SecretId: SECRET_ID,
      ClientRequestToken: CLIENT_REQUEST_TOKEN,
    }),
  ).rejects.toThrow('Invalid step parameter "invalid"');

  // describeSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('create secret pending already created', async () => {
  mockSecretsManager();

  await handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('create secret create pending', async () => {
  mockSecretsManager({ pendingSecretError: true });

  await handler({ Step: 'createSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret, getSecret, getRandomPassword, putSecretValue
  expect(mockSecretsManagerClient.calls()).toHaveLength(5);
});

test('set secret pending already set', async () => {
  mockSecretsManager();
  mockDatabaseConnections({ AWSPENDING: { connection: true } });

  await handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('set secret current works', async () => {
  mockSecretsManager();
  mockDatabaseConnections({ AWSCURRENT: { connection: true } });

  await handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(3);
});

test('set secret previous works', async () => {
  mockSecretsManager();
  mockDatabaseConnections({ AWSPREVIOUS: { connection: true } });

  await handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret, getSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(4);
});

test('set secret none works', async () => {
  mockSecretsManager();
  mockDatabaseConnections({});

  await expect(
    handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('setSecret: Unable to log into database with previous, current, or pending secret');

  // describeSecret, getSecret, getSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(4);
});

test('set secret error changing password', async () => {
  const errorMessage = 'error setting password';
  mockSecretsManager();
  mockDatabaseConnections({ AWSCURRENT: { connection: true, rawError: errorMessage } });

  await expect(
    handler({ Step: 'setSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow(`setSecret: Error changing database password - "${errorMessage}"`);

  // describeSecret, getSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(3);
});

test('test secret success', async () => {
  mockSecretsManager();
  mockDatabaseConnections({ AWSPENDING: { connection: true } });

  await handler({ Step: 'testSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('test secret bad secret', async () => {
  mockSecretsManager({ pendingSecretError: true });
  mockDatabaseConnections({ AWSPENDING: { connection: true } });

  await expect(
    handler({ Step: 'testSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('Error getting secret - pending secret error');

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('test secret bad connection', async () => {
  mockSecretsManager();
  mockDatabaseConnections({});

  await expect(
    handler({ Step: 'testSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN }),
  ).rejects.toThrow('testSecret: Unable to log into database with pending secret');

  // describeSecret, getSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('finish secret already marked as current', async () => {
  mockSecretsManager({ versions: { [CLIENT_REQUEST_TOKEN]: ['AWSCURRENT'] } });

  await handler({ Step: 'finishSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret
  expect(mockSecretsManagerClient.calls()).toHaveLength(1);
});

test('finish secret current version exists but is not this one', async () => {
  mockSecretsManager({ versions: { [CLIENT_REQUEST_TOKEN]: ['AWSPENDING'], randomVersionId: ['AWSCURRENT'] } });

  await handler({ Step: 'finishSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, updateSecretVersionStage
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('finish secret no current version', async () => {
  mockSecretsManager();

  await handler({ Step: 'finishSecret', SecretId: SECRET_ID, ClientRequestToken: CLIENT_REQUEST_TOKEN });

  // describeSecret, updateSecretVersionStage
  expect(mockSecretsManagerClient.calls()).toHaveLength(2);
});

test('secret to database connection', async () => {
  // @ts-expect-error this incorrectly extends DatabaseAccess by overriding a private method but it's fine as it's a test
  const databaseAccess = new (class extends DatabaseAccess {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async validateConnection(connection: Knex<any, unknown[]>): Promise<Knex<any, unknown[]>> {
      return connection;
    }
  })(getLogger(''));

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

const mockSecretsManager = (config: SecretsManagerMockingConfig = {}): void => {
  const pendingSecretError = config.pendingSecretError ?? false;
  const versions = config.versions ?? { [CLIENT_REQUEST_TOKEN]: ['AWSPENDING'] };
  mockSecretsManagerClient
    .on(DescribeSecretCommand, { SecretId: SECRET_ID })
    .resolvesOnce({ RotationEnabled: true, VersionIdsToStages: versions })
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
    .resolvesOnce({ RandomPassword: 'password123' })
    .on(PutSecretValueCommand, { SecretId: SECRET_ID })
    .resolvesOnce({})
    .on(UpdateSecretVersionStageCommand, { SecretId: SECRET_ID, VersionStage: 'AWSCURRENT' })
    .resolvesOnce({});
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
        await Promise.reject(error);
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
