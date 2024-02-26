import { getLogger } from '../../shared/powertools';
import { getEnvironmentVariable, getErrorMessage } from '../../shared/utils/utils';
import { getSecret } from '../../shared/secrets-manager/get-secret';
import type { RedshiftSecret } from '../../shared/types/secrets-manager';
import * as child_process from 'node:child_process';
import { s3Client } from '../../shared/clients';
import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import * as fs from 'node:fs';
import { Readable } from 'node:stream';

const logger = getLogger('lambda/run-flyway-command');

const FLYWAY_COMMANDS = ['clean', 'info', 'migrate', 'validate'];

const LAMBDA_FILES_ROOT = '/tmp/flyway';

const CONFIG_FILE_NAME = 'flyway.conf';

const MIGRATIONS_DIRECTORY_NAME = 'migrations';

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
    fs.mkdirSync(`${LAMBDA_FILES_ROOT}/${MIGRATIONS_DIRECTORY_NAME}`, { recursive: true });
    const bucket = getEnvironmentVariable('FLYWAY_FILES_BUCKET_NAME');

    const files = await s3Client.send(new ListObjectsV2Command({ Bucket: bucket }));
    for (const file of files.Contents ?? []) {
      const getObject = await getFile(bucket, file.Key);
      await writeToFile(getObject, file.Key);
    }
  } catch (error) {
    throw new Error(`Error getting flyway files - ${getErrorMessage(error)}`);
  }
};

const getFile = async (bucket: string, key: string | undefined): Promise<GetObjectCommandOutput> => {
  return await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
};

const writeToFile = async (response: GetObjectCommandOutput, filename: string | undefined): Promise<void> => {
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
  FLYWAY_LOCATIONS: `filesystem:${LAMBDA_FILES_ROOT}/${MIGRATIONS_DIRECTORY_NAME}`,
  FLYWAY_CONFIG_FILES: `${LAMBDA_FILES_ROOT}/${CONFIG_FILE_NAME}`,
});

const runFlywayCommand = (event: RunFlywayEvent, environment: Record<string, string>): RunFlywayResult => {
  const env = { ...process.env, ...environment };
  const result = child_process.spawnSync('run-flyway', [event.command], { env });
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
