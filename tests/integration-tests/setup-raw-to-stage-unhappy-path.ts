/* eslint-disable no-console */
import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { setIntegrationEnvVarsFromSsm } from './helpers/config/ssm-config';
import { sweepMalformedRawEvents } from './helpers/aws/s3/sweep-malformed-raw-events';

export default async () => {
  process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
  process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;
  await setIntegrationEnvVarsFromSsm();

  // Guard: remove any malformed events orphaned by a previously interrupted run before
  // this suite starts, so the raw layer is clean regardless of prior failures.
  const preRunDeleted = await sweepMalformedRawEvents();
  if (preRunDeleted.length > 0) {
    console.log(`🧹 Pre-run sweep removed ${preRunDeleted.length} orphaned malformed raw event(s)`);
  }

  // Teardown runs even if tests fail or are aborted. This guarantees the deliberately
  // malformed events this suite writes can never survive to poison the main-suite ETL,
  // whose query window spans several days of the shared raw layer.
  return async () => {
    const deleted = await sweepMalformedRawEvents();
    console.log(`🧹 Teardown sweep removed ${deleted.length} malformed raw event(s)`);
  };
};
