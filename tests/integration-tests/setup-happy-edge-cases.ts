/* eslint-disable no-console */
import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { addMessageToQueue } from './helpers/aws/sqs/add-message-to-queue';
import { executeStepFunction } from './helpers/aws/step-function/execute-step-function';
import { setEnvVarsFromSsm } from './helpers/config/ssm-config';
import { getIntegrationTestEnv } from './helpers/utils/utils';
import { pollForRawLayerData, pollForStageLayerData } from './helpers/utils/poll-for-athena-data';
import { happyPathEventList } from './test-events/happy-path-events/happy-path-event-list';
import { edgeCaseEventList } from './test-events/edge-case-events/edge-case-event-list';
import { txmaUnhappyPathEventList } from './test-events/txma-consumer-unhappy-path-events/txma-consumer-unhappy-event-list';
import { AuditEvent } from '../../common/types/event';
import { grantRedshiftAccess } from './helpers/aws/redshift/grant-access';
import { pollForFactJourneyData } from './helpers/utils/poll-for-redshift-data';

export default async () => {
  const setupStartTime = Date.now();

  try {
    process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
    process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

    await setEnvVarsFromSsm();

    console.log('🔐 Granting Redshift permissions...');
    await grantRedshiftAccess(getIntegrationTestEnv('REDSHIFT_WORKGROUP_NAME'));
    console.log('✓ Redshift permissions granted');

    console.log('🚀 Starting integration test setup...');
    const processedEvents: AuditEvent[] = [];
    // Process happy path events
    for (const eventPair of happyPathEventList) {
      const event = eventPair.auditEvent;
      await addMessageToQueue(event, getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL'));
      processedEvents.push(event);
    }
    // Process edge case events
    for (const eventPair of edgeCaseEventList) {
      const event = eventPair.auditEvent;
      await addMessageToQueue(event, getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL'));
      processedEvents.push(event);
    }
    // Process unhappy path events (sent to queue but not polled for in raw/stage layers)
    for (const eventPair of txmaUnhappyPathEventList) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addMessageToQueue(eventPair.auditEvent as any, getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL'));
    }
    console.log(`✓ Sent ${processedEvents.length + txmaUnhappyPathEventList.length} events to SQS queue `);

    // Store both events and event pairs globally for tests to access
    (
      global as {
        testEvents?: AuditEvent[];
        testEventPairs?: typeof happyPathEventList;
        edgeCaseEventPairs?: typeof edgeCaseEventList;
        unhappyPathEventPairs?: typeof txmaUnhappyPathEventList;
      }
    ).testEvents = processedEvents;
    (
      global as {
        testEvents?: AuditEvent[];
        testEventPairs?: typeof happyPathEventList;
        edgeCaseEventPairs?: typeof edgeCaseEventList;
        unhappyPathEventPairs?: typeof txmaUnhappyPathEventList;
      }
    ).testEventPairs = happyPathEventList;
    (
      global as {
        testEvents?: AuditEvent[];
        testEventPairs?: typeof happyPathEventList;
        edgeCaseEventPairs?: typeof edgeCaseEventList;
        unhappyPathEventPairs?: typeof txmaUnhappyPathEventList;
      }
    ).edgeCaseEventPairs = edgeCaseEventList;
    (
      global as {
        testEvents?: AuditEvent[];
        testEventPairs?: typeof happyPathEventList;
        edgeCaseEventPairs?: typeof edgeCaseEventList;
        unhappyPathEventPairs?: typeof txmaUnhappyPathEventList;
      }
    ).unhappyPathEventPairs = txmaUnhappyPathEventList;

    console.log('⏳ Waiting for events to appear in raw layer...');
    const rawLayerStartTime = Date.now();
    const eventIds = processedEvents.map(event => event.event_id);
    await pollForRawLayerData(eventIds, { maxWaitTimeMs: 5 * 60 * 1000 }); // 5 minute max wait
    const rawLayerDuration = Date.now() - rawLayerStartTime;
    console.log(`✓ Raw layer processing completed in ${Math.round(rawLayerDuration / 1000)}s`);

    const rawToStageStepFunction = getIntegrationTestEnv('RAW_TO_STAGE_STEP_FUNCTION');
    console.log('⚙️ Executing ETL step function...');
    const stepFunctionStartTime = Date.now();

    await executeStepFunction(rawToStageStepFunction, undefined, 'integration-test-setup');
    const stepFunctionDuration = Date.now() - stepFunctionStartTime;
    console.log(`✓ Step Function completed in ${Math.round(stepFunctionDuration / 1000)}s`);

    console.log('⏳ Waiting for events to appear in stage layer...');
    const stageLayerStartTime = Date.now();
    await pollForStageLayerData(eventIds, { maxWaitTimeMs: 2 * 60 * 1000 }); // 2 minute max wait
    const stageLayerDuration = Date.now() - stageLayerStartTime;
    console.log(`✓ Stage layer processing completed in ${Math.round(stageLayerDuration / 1000)}s`);

    console.log('⏳ Waiting for events to appear in fact journey table...');
    const factJourneyStartTime = Date.now();
    await pollForFactJourneyData(eventIds, { maxWaitTimeMs: 2 * 60 * 1000 }); // 2 minute max wait
    const factJourneyDuration = Date.now() - factJourneyStartTime;
    console.log(`✓ Fact journey processing completed in ${Math.round(factJourneyDuration / 1000)}s`);

    const totalSetupDuration = Date.now() - setupStartTime;
    console.log(`🎉 Integration test setup completed successfully in ${Math.round(totalSetupDuration / 1000)}s`);
  } catch (error) {
    const setupDuration = Date.now() - setupStartTime;
    console.error(`❌ Integration test setup failed after ${Math.round(setupDuration / 1000)}s:`, error);
    throw error;
  }
};
