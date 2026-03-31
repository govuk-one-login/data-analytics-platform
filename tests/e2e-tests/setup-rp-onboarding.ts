/* eslint-disable no-console */
import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { addMessageToQueue } from '../shared-test-code/aws/sqs/add-message-to-queue';
import { executeStepFunction } from '../shared-test-code/aws/step-function/execute-step-function';
import { generateTimestamp, generateTimestampFormatted } from '../shared-test-code/utils';
import { pollForRawLayerData, pollForStageLayerData } from '../shared-test-code/poll-for-athena-data';
import { pollForFactJourneyData } from '../shared-test-code/poll-for-redshift-data';
import { grantRedshiftAccess } from '../shared-test-code/aws/redshift/grant-access';
import { setE2EEnvVarsFromSsm } from './helpers/config/ssm-config';
import { constructTestEvent } from './test-events/rp-onboarding-test-event';
import { rpOnboardingTestEvents } from './config/rp-onboarding.config';
import { getE2ETestEnv } from './helpers/utils/utils';
import { AuditEvent } from '../../common/types/event';

export default async function globalSetup() {
  const setupStartTime = Date.now();

  try {
    process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
    process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

    await setE2EEnvVarsFromSsm();
    await grantRedshiftAccess(getE2ETestEnv('REDSHIFT_WORKGROUP_NAME'));

    const queueUrl = getE2ETestEnv('DAP_E2E_TEST_PRODUCER_QUEUE_URL');
    const timestamp = generateTimestamp();
    const timestampFormatted = generateTimestampFormatted();

    const sentEvents: AuditEvent[] = [];
    for (const testEvent of rpOnboardingTestEvents) {
      const event = constructTestEvent(testEvent.clientId, timestamp, timestampFormatted);
      await addMessageToQueue(event, queueUrl);
      sentEvents.push(event);
      console.log(`📤 Sent event:`, JSON.stringify(event, null, 2));
    }

    const eventIds = sentEvents.map(e => e.event_id);

    console.log(
      '⏳ Waiting 10 mins before polling (event-processing transit + DAP batching can take up to 15 mins)...',
    );
    const rawPollStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));

    console.log('⏳ Now polling for events in raw layer (up to 15 mins)...');
    await pollForRawLayerData(eventIds, {
      maxWaitTimeMs: 15 * 60 * 1000,
      pollIntervalMs: 10000,
    });
    console.log(`✅ Events found in raw layer after ${Math.round((Date.now() - rawPollStart) / 1000)}s`);

    const rawToStageStepFunction = getE2ETestEnv('RAW_TO_STAGE_STEP_FUNCTION');
    await executeStepFunction(rawToStageStepFunction, undefined, 'rp-onboarding-e2e', 25 * 60 * 1000);
    await pollForStageLayerData(eventIds, {
      maxWaitTimeMs: 10 * 60 * 1000,
      pollIntervalMs: 10000,
    });
    await pollForFactJourneyData(eventIds, { maxWaitTimeMs: 5 * 60 * 1000, pollIntervalMs: 5000 });

    const totalSetupDuration = Date.now() - setupStartTime;
    console.log(`🎉 RP Onboarding e2e setup completed in ${Math.round(totalSetupDuration / 1000)}s`);
  } catch (error) {
    const setupDuration = Date.now() - setupStartTime;
    console.error(`❌ RP Onboarding e2e setup failed after ${Math.round(setupDuration / 1000)}s:`, error);
    throw error;
  }
}
