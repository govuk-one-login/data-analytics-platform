/* eslint-disable no-console */
import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { setEnvVarsFromSsm } from './helpers/config/ssm-config';

export default async () => {
  process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
  process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

  console.log('🚀 Loading environment variables for unhappy path tests...');
  await setEnvVarsFromSsm();
  console.log('✓ Environment variables loaded');
};
