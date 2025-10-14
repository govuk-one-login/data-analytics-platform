import { IntegrationTestEnv } from '../../types/integrationTestEnv';

export const getIntegrationTestEnv = (name: IntegrationTestEnv['name']) => {
  const env = process.env[name];

  if (env === undefined || env === null) {
    throw Error(`Missing environment variable: ${name}`);
  }

  return env;
};
