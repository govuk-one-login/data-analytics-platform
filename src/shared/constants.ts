export const AWS_REGION = 'eu-west-2';

export const AWS_CLIENT_BASE_CONFIG = { region: AWS_REGION } as const;

export const AWS_ENVIRONMENTS = [
  'dev',
  'test',
  'feature',
  'build',
  'staging',
  'integration',
  'production',
  'production-preview',
] as const;
