import { IntegrationTestEnv } from '../../types/integration-test-env';

export const getIntegrationTestEnv = (name: IntegrationTestEnv['name']) => {
  const env = process.env[name];

  if (env === undefined || env === null) {
    throw Error(`Missing environment variable: ${name}`);
  }

  return env;
};

export function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function generateTimestampInMs(): number {
  return Date.now();
}

export function generateTimestampFormatted(): string {
  return new Date().toISOString();
}

export function generateDateCreatedPartition(): string {
  const now = new Date();
  return `year=${now.getFullYear()}/month=${now.getMonth() + 1}/day=${now.getDate()}`;
}

export function generateProcessedDt(): number {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return parseInt(`${year}${month}${day}`);
}

export function generateProcessedTime(): number {
  // Use current timestamp - tests will need to handle the fact this won't match exactly
  return Math.floor(Date.now() / 1000);
}
