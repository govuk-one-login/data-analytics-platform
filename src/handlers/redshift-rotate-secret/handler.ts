import { ensureDefined, getEnvironmentVariable, getErrorMessage } from '../../shared/utils/utils';
import { getLogger } from '../../shared/powertools';
import { secretsManagerClient } from '../../shared/clients';
import type { DescribeSecretCommandOutput } from '@aws-sdk/client-secrets-manager';
import {
  DescribeSecretCommand,
  GetRandomPasswordCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretVersionStageCommand,
} from '@aws-sdk/client-secrets-manager';
import * as crypto from 'node:crypto';
import { DatabaseAccess } from './database-access';

const logger = getLogger('lambda/redshift-rotate-secret');

export type RotateSecretStep = 'createSecret' | 'setSecret' | 'testSecret' | 'finishSecret';

interface RotateSecretEvent {
  Step: RotateSecretStep;
  SecretId: string;
  ClientRequestToken: string;
}

// based on https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_secret_json_structure.html#reference_secret_json_structure_RS
export interface RedshiftSecret {
  engine: 'redshift';
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}

export type SecretRotationStage = 'AWSPREVIOUS' | 'AWSCURRENT' | 'AWSPENDING';

export const databaseAccess = new DatabaseAccess(logger);

/**
 * Most of the code in this function is based on the AWS sample here<br>
 * {@link https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas/blob/master/SecretsManagerRedshiftRotationSingleUser/lambda_function.py}
 *
 * and a JavaScript version here (src/rotateSingleUser.js)<br>
 * {@link https://www.npmjs.com/package/aws-secrets-manager-rotation-lambdas?activeTab=code}
 */
export const handler = async (event: RotateSecretEvent): Promise<void> => {
  try {
    logger.info('Rotate secret lambda', { event });
    await rotateSecret(event);
  } catch (error) {
    logger.error(`Error rotating secret ${event.SecretId}`, { error });
    throw error;
  }
};

const rotateSecret = async (event: RotateSecretEvent): Promise<void> => {
  const metadata = await describeSecret(event);
  if (metadata.RotationEnabled === false) {
    logAndThrow('Secret is not enabled for rotation');
  }

  const versions = metadata.VersionIdsToStages ?? {};
  const version = versions[event.ClientRequestToken];
  if (version === undefined || version.length === 0) {
    logAndThrow(`Secret version ${event.ClientRequestToken} has no stage for rotation`);
  }

  if (version.includes('AWSCURRENT')) {
    logger.info(`Secret version ${event.ClientRequestToken} already set as AWSCURRENT`);
    return;
  } else if (!version.includes('AWSPENDING')) {
    logAndThrow(`Secret version ${event.ClientRequestToken} not set as AWSPENDING`);
  }

  if (event.Step === 'createSecret') {
    await createSecret(event);
  } else if (event.Step === 'setSecret') {
    await setSecret(event);
  } else if (event.Step === 'testSecret') {
    await testSecret(event);
  } else if (event.Step === 'finishSecret') {
    await finishSecret(event, versions);
  } else {
    logAndThrow(`Invalid step parameter ${JSON.stringify(event.Step)}`);
  }
};

// generate a new secret
const createSecret = async (event: RotateSecretEvent): Promise<void> => {
  try {
    await getSecret(event, 'AWSPENDING');
    logger.info('createSecret: Successfully retrieved secret');
  } catch (error) {
    await updateSecretPassword(event);
    logger.info(`createSecret: Successfully put secret version ${event.ClientRequestToken}`);
  }
};

// set the pending secret in the database
const setSecret = async (event: RotateSecretEvent): Promise<void> => {
  const pendingSecret = await getSecret(event, 'AWSPENDING');
  let loginSecret = pendingSecret;
  logger.info('setSecret: Trying connection with AWSPENDING secret');
  let connection = await databaseAccess.getDatabaseConnection(loginSecret);
  if (connection !== null) {
    logger.info('setSecret: AWSPENDING secret is already set as password in Redshift DB');
    return;
  }

  loginSecret = await getSecret(event, 'AWSCURRENT');
  logger.info('setSecret: Trying connection with AWSCURRENT secret');
  connection = await databaseAccess.getDatabaseConnection(loginSecret);

  if (connection === null) {
    loginSecret = await getSecret(event, 'AWSPREVIOUS');
    logger.info('setSecret: Trying connection with AWSPREVIOUS secret');
    connection = await databaseAccess.getDatabaseConnection(loginSecret);

    if (connection === null) {
      logAndThrow('setSecret: Unable to log into database with previous, current, or pending secret');
      return; // typescript needs this to believe connection won't be null below, although the previous line throws
    }
  }

  // if we get a connection, set the admin password to the pending secret password
  try {
    await connection.raw(`alter user ${loginSecret.username} with password '${hashedPasswordUsername(pendingSecret)}'`);
    logger.info(`setSecret: Successfully set password for user ${loginSecret.username} in Redshift DB`);
  } catch (error) {
    logAndThrow(`setSecret: Error changing database password - ${getErrorMessage(error)}`);
  } finally {
    await connection.destroy();
  }
};

// test the pending secret against the database
const testSecret = async (event: RotateSecretEvent): Promise<void> => {
  const secret = await getSecret(event, 'AWSPENDING');
  const connection = await databaseAccess.getDatabaseConnection(secret);
  if (connection === null) {
    logAndThrow('testSecret: Unable to log into database with pending secret');
  } else {
    logger.info('testSecret: Successfully signed into Redshift DB with AWSPENDING secret');
    await connection.destroy();
  }
};

// finish the rotation by marking the pending secret as current
const finishSecret = async (event: RotateSecretEvent, versions: Record<string, string[]>): Promise<void> => {
  let currentVersion: string | undefined;
  for (const [versionId, stages] of Object.entries(versions)) {
    if (stages.includes('AWSCURRENT')) {
      if (versionId === event.ClientRequestToken) {
        logger.info(`finishSecret: Version ${versionId} already marked as AWSCURRENT`);
        return;
      }
      currentVersion = versionId;
      break;
    }
  }

  await updateSecretVersionStage(event, currentVersion);
  logger.info(`finishSecret: Successfully set AWSCURRENT stage to version ${event.ClientRequestToken} for secret`);
};

const getSecret = async (event: RotateSecretEvent, stage: SecretRotationStage): Promise<RedshiftSecret> => {
  try {
    const secretString = await secretsManagerClient
      .send(
        new GetSecretValueCommand({
          SecretId: event.SecretId,
          VersionStage: stage,
          ...(stage === 'AWSPENDING' ? { VersionId: event.ClientRequestToken } : {}),
        }),
      )
      .then(response => ensureDefined(() => response.SecretString));
    return JSON.parse(secretString);
  } catch (error) {
    throw new Error(`Error getting secret - ${getErrorMessage(error)}`);
  }
};

const describeSecret = async (event: RotateSecretEvent): Promise<DescribeSecretCommandOutput> => {
  try {
    return await secretsManagerClient.send(
      new DescribeSecretCommand({
        SecretId: event.SecretId,
      }),
    );
  } catch (error) {
    throw new Error(`Error getting secret metadata - ${getErrorMessage(error)}`);
  }
};

const getRandomPassword = async (): Promise<string> => {
  try {
    const passwordLength = parseInt(getEnvironmentVariable('PASSWORD_LENGTH'));
    const excludeChars = getEnvironmentVariable('PASSWORD_EXCLUDE_CHARS');
    return await secretsManagerClient
      .send(
        new GetRandomPasswordCommand({
          PasswordLength: passwordLength,
          ExcludeCharacters: excludeChars,
        }),
      )
      .then(response => ensureDefined(() => response.RandomPassword));
  } catch (error) {
    throw new Error(`Error getting random password - ${getErrorMessage(error)}`);
  }
};

const updateSecretPassword = async (event: RotateSecretEvent): Promise<void> => {
  try {
    const currentSecret = await getSecret(event, 'AWSCURRENT');
    const newPassword = await getRandomPassword();
    await secretsManagerClient.send(
      new PutSecretValueCommand({
        SecretId: event.SecretId,
        ClientRequestToken: event.ClientRequestToken,
        SecretString: JSON.stringify({
          ...currentSecret,
          password: newPassword,
        }),
        VersionStages: ['AWSPENDING'],
      }),
    );
  } catch (error) {
    throw new Error(`Error putting secret value - ${getErrorMessage(error)}`);
  }
};

const updateSecretVersionStage = async (
  event: RotateSecretEvent,
  currentVersion: string | undefined,
): Promise<void> => {
  try {
    await secretsManagerClient.send(
      new UpdateSecretVersionStageCommand({
        SecretId: event.SecretId,
        VersionStage: 'AWSCURRENT',
        MoveToVersionId: event.ClientRequestToken,
        RemoveFromVersionId: currentVersion,
      }),
    );
  } catch (error) {
    throw new Error(`Error updating secret version stage - ${getErrorMessage(error)}`);
  }
};

const logAndThrow = (message: string): never => {
  logger.error(message);
  throw new Error(message);
};

// redshift can accept the password as an MD5 hash of the password concatenated with the username
// the md5 prefix is needed so it knows to interpret the string as this rather than a normal string password
// this method was convenient to use to avoid any issues with quoting or escaping special characters
// see docs here https://docs.aws.amazon.com/redshift/latest/dg/r_CREATE_USER.html (the PASSWORD section)
const hashedPasswordUsername = (secret: RedshiftSecret): string => {
  const passwordUsername = `${secret.password}${secret.username}`;
  return `md5${crypto.createHash('md5').update(passwordUsername).digest('hex')}`;
};
