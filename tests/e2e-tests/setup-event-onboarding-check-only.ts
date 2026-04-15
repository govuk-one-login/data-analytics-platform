import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { grantRedshiftAccess } from '../shared-test-code/aws/redshift/grant-access';
import { setE2EEnvVarsFromSsm } from './helpers/config/ssm-config';
import { getE2ETestEnv } from './helpers/utils/utils';

export default async function globalSetup() {
  process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
  process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

  await setE2EEnvVarsFromSsm();
  await grantRedshiftAccess(getE2ETestEnv('REDSHIFT_WORKGROUP_NAME'));

  const eventNamesEnv = process.env.EVENT_ONBOARDING_EVENT_NAMES;
  if (!eventNamesEnv) {
    throw new Error('EVENT_ONBOARDING_EVENT_NAMES env var is required for check-only mode.');
  }

  (global as { checkOnlyEventNames?: string[] }).checkOnlyEventNames = eventNamesEnv.split(',').map(v => v.trim());
}
