import { IntegrationTestEnv } from '../../types/integrationTestEnv';

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
