import { getTestEnv } from '../../../shared-test-code/utils/get-test-env';
import { IntegrationTestEnvName } from '../../types/integration-test-env';

export { generateTimestamp, generateTimestampFormatted } from '../../../shared-test-code/utils';

export const getIntegrationTestEnv = (name: IntegrationTestEnvName): string => getTestEnv(name);

export const generateTimestampInMs = (): number => {
  return Date.now();
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
  return Math.floor(Date.now() / 1000);
};
