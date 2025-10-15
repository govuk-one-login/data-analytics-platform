import { v4 as uuidv4 } from 'uuid';
import { constructDCMAWAsyncBiometricTokenIssuedDAPEvent } from '../test-events/DCMAWAsyncBiometricTokenIssuedDAPEvent';
import { addMessageToQueue } from '../helpers/aws/sqs/addMessageToQueue';
import { getIntegrationTestEnv } from '../helpers/utils/utils';

describe('Raw to Stage Integration Tests', () => {
  // TODO: Add test implementation
});
// Create test event - Set uuid()
// Push test event into queue
// Wait until test event is processed
// Verify S3 contains expected object
// Run raw to stage ETL job
// Query Athena to validate the event appear in the stage_layer table correctly
// Delete test data in afterAll()

export function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function generateTimestampInMs(): number {
  return Date.now();
}

export function generateTimestampFormatted(): string {
  return new Date().toISOString();
}

const timestamp = generateTimestamp();
const timestamp_formatted = generateTimestampFormatted();
const event_timestamp_ms = generateTimestampInMs();
const event_timestamp_ms_formatted = generateTimestampFormatted();
const event_id = uuidv4();

export const testEvent = [
  {
    auditEvent: constructDCMAWAsyncBiometricTokenIssuedDAPEvent(
      event_id,
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'e2eTestClientId',
      'e2eTestCommonSubjectId',
      'journeyId',
    ),
  },
];

test.each(testEvent)('Put $auditEvent.event_name event on DAP sqs queue for DAP testing', async params => {
  await addMessageToQueue(params.auditEvent, getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL'));
});
