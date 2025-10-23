import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { addMessageToQueue } from './helpers/aws/sqs/add-message-to-queue';
import { executeStepFunction } from './helpers/aws/step-function/execute-step-function';
import { setEnvVarsFromSsm } from './helpers/config/ssm-config';
import { getIntegrationTestEnv } from './helpers/utils/utils';
import { pollForRawLayerData, pollForStageLayerData } from './helpers/utils/poll-for-data';
import { happyPathEventList } from './test-events/happy-path-event-list';
import { AuditEvent } from '../../src/shared/types/event';

export default async () => {
  const setupStartTime = Date.now();

  try {
    process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
    process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

    await setEnvVarsFromSsm();

    // eslint-disable-next-line no-console
    console.log('🚀 Starting integration test setup...');
    const processedEvents: AuditEvent[] = [];
    for (const eventPair of happyPathEventList) {
      const event = eventPair.AuditEvent;
      await addMessageToQueue(event, getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL'));
      processedEvents.push(event);
    }
    // eslint-disable-next-line no-console
    console.log(`✓ Sent ${processedEvents.length} events to SQS queue`);

    // Store both events and event pairs globally for tests to access
    (global as { testEvents?: AuditEvent[]; testEventPairs?: typeof happyPathEventList }).testEvents = processedEvents;
    (global as { testEvents?: AuditEvent[]; testEventPairs?: typeof happyPathEventList }).testEventPairs =
      happyPathEventList;

    // eslint-disable-next-line no-console
    console.log('⏳ Waiting for events to appear in raw layer...');
    const rawLayerStartTime = Date.now();
    const eventIds = processedEvents.map(event => event.event_id);
    await pollForRawLayerData(eventIds, { maxWaitTimeMs: 3 * 60 * 1000 }); // 3 minute max wait
    const rawLayerDuration = Date.now() - rawLayerStartTime;
    // eslint-disable-next-line no-console
    console.log(`✓ Raw layer processing completed in ${Math.round(rawLayerDuration / 1000)}s`);

    const rawToStageStepFunction = getIntegrationTestEnv('RAW_TO_STAGE_STEP_FUNCTION');
    // eslint-disable-next-line no-console
    console.log('⚙️ Executing ETL step function...');
    const stepFunctionStartTime = Date.now();

    await executeStepFunction(rawToStageStepFunction);
    const stepFunctionDuration = Date.now() - stepFunctionStartTime;
    // eslint-disable-next-line no-console
    console.log(`✓ Step Function completed in ${Math.round(stepFunctionDuration / 1000)}s`);

    // eslint-disable-next-line no-console
    console.log('⏳ Waiting for events to appear in stage layer...');
    const stageLayerStartTime = Date.now();
    await pollForStageLayerData(eventIds, { maxWaitTimeMs: 2 * 60 * 1000 }); // 2 minute max wait
    const stageLayerDuration = Date.now() - stageLayerStartTime;
    // eslint-disable-next-line no-console
    console.log(`✓ Stage layer processing completed in ${Math.round(stageLayerDuration / 1000)}s`);

    const totalSetupDuration = Date.now() - setupStartTime;
    // eslint-disable-next-line no-console
    console.log(`🎉 Integration test setup completed successfully in ${Math.round(totalSetupDuration / 1000)}s`);
  } catch (error) {
    const setupDuration = Date.now() - setupStartTime;
    // eslint-disable-next-line no-console
    console.error(`❌ Integration test setup failed after ${Math.round(setupDuration / 1000)}s:`, error);
    throw error;
  }
};
