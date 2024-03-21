import { getLogger } from '../../shared/powertools';
import { findOrThrow, getAWSEnvironment, getEnvironmentVariable, getErrorMessage } from '../../shared/utils/utils';
import { getSecret } from '../../shared/secrets-manager/get-secret';
import type { RedshiftSecret } from '../../shared/types/secrets-manager';
import * as child_process from 'node:child_process';
import { s3Client } from '../../shared/clients';
import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import * as fs from 'node:fs';
import { Readable } from 'node:stream';
import * as tar from 'tar';
import * as path from 'node:path';

const logger = getLogger('lambda/run-flyway-command');

const FLYWAY_COMMANDS = ['clean', 'info', 'migrate', 'validate'];

const LAMBDA_FILES_ROOT = '/tmp/flyway';

const CONFIG_FILE_PATH = `${LAMBDA_FILES_ROOT}/flyway.conf`;

const MIGRATIONS_DIRECTORY_PATH = `${LAMBDA_FILES_ROOT}/migrations`;

const LIBRARY_FILES_PATH = `${LAMBDA_FILES_ROOT}/lib`;

type FlywayCommand = (typeof FLYWAY_COMMANDS)[number];

interface RunFlywayEvent {
  command: FlywayCommand;
  database: string;
}

interface RunFlywayResult {
  stdout: Record<string, unknown> | null;
  stderr: Record<string, unknown> | null;
  status: number | null;
  error?: Error;
}

export const handler = async (event: RunFlywayEvent): Promise<RunFlywayResult> => {
  try {
    const validated = validateEvent(event);
    logger.info('Starting run flyway command lambda', { event: validated });
    await getFlywayFiles();
    await setupFlywayLibrary();
    const redshiftSecret = await getRedshiftSecret();
    const flywayEnvironment = await getFlywayEnvironment(validated, redshiftSecret);
    return runFlywayCommand(validated, flywayEnvironment);
  } catch (error) {
    logger.error('Error running flyway command', { error });
    throw error;
  }
};

const validateEvent = (event: RunFlywayEvent): RunFlywayEvent => {
  if (!FLYWAY_COMMANDS.includes(event.command)) {
    throw new Error(`Unknown command ${JSON.stringify(event.command)}`);
  }
  return event;
};

const getFlywayFiles = async (): Promise<void> => {
  try {
    const bucket = getEnvironmentVariable('FLYWAY_FILES_BUCKET_NAME');
    const keys = await getAllKeys(bucket);
    for (const key of keys) {
      const getObject = await getFile(bucket, key);
      createNecessaryDirectories(key);
      await writeToFile(getObject, key);
    }
  } catch (error) {
    throw new Error(`Error getting flyway files - ${getErrorMessage(error)}`);
  }
};

const getAllKeys = async (bucketName: string): Promise<string[]> => {
  const response = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName }));
  const contents = response?.Contents;
  if (contents === undefined || contents.length === 0) {
    throw new Error('Bucket contents are undefined or empty');
  }
  // have to use the type guard otherwise typescript thinks the filter() output is (string | undefined)[]
  // see https://www.benmvp.com/blog/filtering-undefined-elements-from-array-typescript
  return contents.map(file => file.Key).filter((key): key is string => key !== undefined);
};

const getFile = async (bucket: string, key: string): Promise<GetObjectCommandOutput> => {
  return await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
};

const createNecessaryDirectories = (key: string): void => {
  const localPath = `${LAMBDA_FILES_ROOT}/${key}`;
  const dir = path.parse(localPath).dir;
  if (dir.length > 0 && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const writeToFile = async (response: GetObjectCommandOutput, filename: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    if (response.Body instanceof Readable) {
      response.Body.pipe(fs.createWriteStream(`${LAMBDA_FILES_ROOT}/${filename}`))
        .on('error', err => {
          reject(err);
        })
        .on('close', () => {
          resolve();
        });
    }
  });
};

const setupFlywayLibrary = async (): Promise<void> => {
  const libraryFiles = fs.readdirSync(LIBRARY_FILES_PATH);
  const flywayTar = `${LIBRARY_FILES_PATH}/${findOrThrow(libraryFiles, name => name.startsWith('flyway-commandline'))}`;
  const redshiftJar = `${LIBRARY_FILES_PATH}/${findOrThrow(libraryFiles, name => name.startsWith('redshift-jdbc'))}`;

  // extract flyway .tar.gz to /tmp/lib
  await tar.x({ file: flywayTar, stripComponents: 1, C: LIBRARY_FILES_PATH });

  // move redshift jar to /tmp/lib/drivers
  fs.renameSync(redshiftJar, `${LIBRARY_FILES_PATH}/drivers/${path.parse(redshiftJar).base}`);
};

const getRedshiftSecret = async (): Promise<RedshiftSecret> => {
  try {
    const redshiftSecretId = getEnvironmentVariable('REDSHIFT_SECRET_ID');
    return await getSecret(redshiftSecretId);
  } catch (error) {
    throw new Error(`Error getting redshift secret - ${getErrorMessage(error)}`);
  }
};

const getFlywayEnvironment = async (
  event: RunFlywayEvent,
  redshiftSecret: RedshiftSecret,
): Promise<Record<string, string>> => ({
  FLYWAY_URL: `jdbc:redshift://${redshiftSecret.host}:${redshiftSecret.port}/${event.database}`,
  FLYWAY_USER: redshiftSecret.username,
  FLYWAY_PASSWORD: redshiftSecret.password,
  FLYWAY_LOCATIONS: `filesystem:${MIGRATIONS_DIRECTORY_PATH}/${event.database}`,
  FLYWAY_CONFIG_FILES: CONFIG_FILE_PATH,
  FLYWAY_CLEAN_DISABLED: getAWSEnvironment() === 'production' ? 'true' : 'false',
});

const runFlywayCommand = (event: RunFlywayEvent, environment: Record<string, string>): RunFlywayResult => {
  const env = { ...process.env, ...environment };
  const result = child_process.spawnSync(`${LIBRARY_FILES_PATH}/flyway`, [event.command, '-outputType=json'], { env });
  return {
    status: result.status,
    stdout: decodeOutput(result.stdout),
    stderr: decodeOutput(result.stderr),
    error: result.error,
  };
};

const decodeOutput = (output: Buffer): Record<string, unknown> | null => {
  if (output === null) {
    return null;
  }
  try {
    const outputString = output.toString('utf-8');
    const jsonString = outputString === '' ? '{}' : outputString;
    return JSON.parse(jsonString);
  } catch (error) {
    return { parseError: getErrorMessage(error), output };
  }
};
