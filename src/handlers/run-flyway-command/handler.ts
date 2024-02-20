import { getLogger } from '../../shared/powertools';
import { getEnvironmentVariable, getErrorMessage } from '../../shared/utils/utils';
import { getSecret } from '../../shared/secrets-manager/get-secret';
import type { RedshiftSecret } from '../../shared/types/secrets-manager';
import * as child_process from 'node:child_process';

const logger = getLogger('lambda/run-flyway-command');

const FLYWAY_COMMANDS = ['clean', 'info', 'migrate', 'validate'];

type FlywayCommand = (typeof FLYWAY_COMMANDS)[number];

interface RunFlywayEvent {
  command: FlywayCommand;
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
    const redshiftSecret = await getRedshiftSecret();
    const flywayEnvironment = await getFlywayEnvironment(redshiftSecret);
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

const getRedshiftSecret = async (): Promise<RedshiftSecret> => {
  try {
    const redshiftSecretId = getEnvironmentVariable('REDSHIFT_SECRET_ID');
    return await getSecret(redshiftSecretId);
  } catch (error) {
    throw new Error(`Error getting redshift secret - ${getErrorMessage(error)}`);
  }
};

const getFlywayEnvironment = async (redshiftSecret: RedshiftSecret): Promise<Record<string, string>> => ({
  FLYWAY_URL: `jdbc:redshift://${redshiftSecret.host}:${redshiftSecret.port}/dap_txma_reporting_db`,
  FLYWAY_USER: redshiftSecret.username,
  FLYWAY_PASSWORD: redshiftSecret.password,
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
