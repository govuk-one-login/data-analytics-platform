/* eslint-disable no-console */
import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { addMessageToQueue } from '../shared-test-code/aws/sqs/add-message-to-queue';
import { executeStepFunction } from '../shared-test-code/aws/step-function/execute-step-function';
import { setIntegrationEnvVarsFromSsm } from './helpers/config/ssm-config';
import {
  getIntegrationTestEnv,
  generateTimestamp,
  generateTimestampFormatted,
  generateTimestampInMs,
} from './helpers/utils/utils';
import { pollForRawLayerData, pollForStageLayerData } from '../shared-test-code/poll-for-athena-data';
import { pollForFactJourneyData } from '../shared-test-code/poll-for-redshift-data';
import { happyPathEventList } from './test-events/happy-path-events/happy-path-event-list';
import { edgeCaseEventList } from './test-events/edge-case-events/edge-case-event-list';
import { txmaUnhappyPathEventList } from './test-events/txma-consumer-unhappy-path-events/txma-consumer-unhappy-event-list';
import { constructReplayTestEvent } from './test-events/replay-events/replay-event';
import { AuditEvent } from '../../common/types/event';
import { grantRedshiftAccess } from '../shared-test-code/aws/redshift/grant-access';
import { uploadEventToRawLayer } from './helpers/aws/s3/upload-to-s3';
import { constructAuthAuthorisationInitiatedTestEvent10 } from './test-events/happy-path-events/test-event-10-auth-authorisation-initiated-dap';
import { randomUUID } from 'crypto';

export default async () => {
  const setupStartTime = Date.now();

  try {
    process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
    process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

    await setIntegrationEnvVarsFromSsm();
    await grantRedshiftAccess(getIntegrationTestEnv('REDSHIFT_WORKGROUP_NAME'));
    const processedEvents: AuditEvent[] = [];
    const queueUrl = getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL');

    // Process happy path events
    for (const eventPair of happyPathEventList) {
      const event = eventPair.auditEvent;
      await addMessageToQueue(event, queueUrl);
      processedEvents.push(event);
    }
    // Process edge case events
    for (const eventPair of edgeCaseEventList) {
      const event = eventPair.auditEvent;
      await addMessageToQueue(event, queueUrl);
      processedEvents.push(event);
    }
    // Process unhappy path events (sent to queue but not polled for in raw/stage layers)
    for (const eventPair of txmaUnhappyPathEventList) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addMessageToQueue(eventPair.auditEvent as any, queueUrl);
    }

    // Add replay test event
    const replayEvent = constructReplayTestEvent(
      generateTimestamp(),
      generateTimestampFormatted(),
      generateTimestampInMs(),
      generateTimestampFormatted(),
    );
    await addMessageToQueue(replayEvent, queueUrl);
    processedEvents.push(replayEvent);

    // Add deduplication test events (upload directly to S3)
    const deduplicationEventId = randomUUID();
    const baseTimestamp = generateTimestamp();
    const timestamps = [baseTimestamp - 300, baseTimestamp];
    const timestampsFormatted = timestamps.map(ts => new Date(ts * 1000).toISOString());
    const eventTimestampMs = generateTimestampInMs();
    const eventTimestampMsFormatted = generateTimestampFormatted();

    // Create 2 duplicate events with same event_id but different timestamps (5 minutes apart)
    for (let i = 0; i < timestamps.length; i++) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const customKey = `txma-refactored/year=${year}/month=${month}/day=${day}/${deduplicationEventId}-${i}.json.gz`;

      const event = {
        ...constructAuthAuthorisationInitiatedTestEvent10(
          timestamps[i],
          timestampsFormatted[i],
          eventTimestampMs,
          eventTimestampMsFormatted,
        ),
        event_id: deduplicationEventId,
      };
      await uploadEventToRawLayer(event, customKey);
    }

    // Store deduplication data globally
    (global as { deduplicationEventId?: string; deduplicationTimestamps?: string[] }).deduplicationEventId =
      deduplicationEventId;
    (global as { deduplicationEventId?: string; deduplicationTimestamps?: string[] }).deduplicationTimestamps =
      timestampsFormatted;

    // Store events and event pairs globally for tests to access
    (global as { replayEventId?: string; replayId?: string }).replayEventId = replayEvent.event_id;
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

    const eventIds = processedEvents.map(event => event.event_id);
    // Wait 5 seconds for Lambda to start processing before polling
    await new Promise(resolve => setTimeout(resolve, 5000));
    await pollForRawLayerData(eventIds, { maxWaitTimeMs: 5 * 60 * 1000, pollIntervalMs: 5000 });

    const rawToStageStepFunction = getIntegrationTestEnv('RAW_TO_STAGE_STEP_FUNCTION');

    await executeStepFunction(rawToStageStepFunction, undefined, 'integration-test-setup');
    await pollForStageLayerData(eventIds, { maxWaitTimeMs: 2 * 60 * 1000, pollIntervalMs: 5000 });
    await pollForFactJourneyData(eventIds, { maxWaitTimeMs: 5 * 60 * 1000, pollIntervalMs: 5000 });

    const totalSetupDuration = Date.now() - setupStartTime;
    console.log(`🎉 Integration test setup completed successfully in ${Math.round(totalSetupDuration / 1000)}s`);
  } catch (error) {
    const setupDuration = Date.now() - setupStartTime;
    console.error(`❌ Integration test setup failed after ${Math.round(setupDuration / 1000)}s:`, error);
    throw error;
  }
};
