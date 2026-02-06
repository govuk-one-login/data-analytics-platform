/* eslint-disable no-console */
import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { addMessageToQueue } from './helpers/aws/sqs/add-message-to-queue';
import { executeStepFunction } from './helpers/aws/step-function/execute-step-function';
import { setEnvVarsFromSsm } from './helpers/config/ssm-config';
import { getIntegrationTestEnv } from './helpers/utils/utils';
import { pollForRawLayerData, pollForStageLayerData } from './helpers/utils/poll-for-athena-data';
import { pollForFactJourneyData } from './helpers/utils/poll-for-redshift-data';
import { grantRedshiftAccess } from './helpers/aws/redshift/grant-access';
import { constructReplayTestEvent, getReplayEventId } from './test-events/replay-events/replay-event';
import { generateTimestamp, generateTimestampFormatted, generateTimestampInMs } from './helpers/utils/utils';

export default async () => {
  const setupStartTime = Date.now();

  try {
    process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
    process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

    await setEnvVarsFromSsm();

    console.log('🔐 Granting Redshift permissions...');
    await grantRedshiftAccess(getIntegrationTestEnv('REDSHIFT_WORKGROUP_NAME'));
    console.log('✓ Redshift permissions granted');

    console.log('🚀 Starting event replay test setup...');
    const eventId = getReplayEventId();
    console.log(`Event Replay Setup - event_id: ${eventId}`);
    const queueUrl = getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL');

    const timestamp = generateTimestamp();
    const timestamp_formatted = generateTimestampFormatted();
    const event_timestamp_ms = generateTimestampInMs();
    const event_timestamp_ms_formatted = generateTimestampFormatted();

    const initialEvent = constructReplayTestEvent(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
    );

    await addMessageToQueue(initialEvent, queueUrl);
    console.log(`✓ Sent initial event to SQS queue - event_id: ${eventId}`);

    // Store event ID globally for tests to access
    (global as { replayEventId?: string }).replayEventId = eventId;

    console.log('⏳ Waiting for event to appear in raw layer...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    await pollForRawLayerData([getReplayEventId()], { maxWaitTimeMs: 5 * 60 * 1000 });
    console.log(`✓ Raw layer processing completed`);

    const rawToStageStepFunction = getIntegrationTestEnv('RAW_TO_STAGE_STEP_FUNCTION');
    console.log('⚙️ Executing raw-to-stage step function...');
    await executeStepFunction(rawToStageStepFunction, undefined, 'replay-test-setup');
    console.log(`✓ Raw-to-stage step function completed`);

    console.log('⏳ Waiting for event to appear in stage layer...');
    await pollForStageLayerData([getReplayEventId()], { maxWaitTimeMs: 2 * 60 * 1000 });
    console.log(`✓ Stage layer processing completed`);

    console.log('⏳ Waiting for event to appear in conform layer...');
    await pollForFactJourneyData([getReplayEventId()], { maxWaitTimeMs: 5 * 60 * 1000 });
    console.log(`✓ Conform layer processing completed`);

    const totalSetupDuration = Date.now() - setupStartTime;
    console.log(`🎉 Event replay test setup completed successfully in ${Math.round(totalSetupDuration / 1000)}s`);
  } catch (error) {
    const setupDuration = Date.now() - setupStartTime;
    console.error(`❌ Event replay test setup failed after ${Math.round(setupDuration / 1000)}s:`, error);
    throw error;
  }
};
