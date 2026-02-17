import { IntegrationTestEnv } from '../../types/integration-test-env';

export const getIntegrationTestEnv = (name: IntegrationTestEnv['name']) => {
  const env = process.env[name];

  if (env === undefined || env === null) {
    throw Error(`Missing environment variable: ${name}`);
  }

  return env;
};

export const generateTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const generateTimestampInMs = (): number => {
  return Date.now();
};

export const generateTimestampFormatted = (): string => {
  return new Date().toISOString();
};

export const generateDateCreatedPartition = (): string => {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `year=${now.getFullYear()}/month=${month}/day=${day}`;
};

export const generateProcessedDt = (): number => {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return parseInt(`${year}${month}${day}`);
};

export const generateProcessedTime = (): number => {
  // Use current timestamp - tests will need to handle the fact this won't match exactly
  return Math.floor(Date.now() / 1000);
};
