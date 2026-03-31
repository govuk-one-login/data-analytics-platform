export const getTestEnv = (name: string): string => {
  const env = process.env[name];

  if (env === undefined || env === null) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return env;
};
