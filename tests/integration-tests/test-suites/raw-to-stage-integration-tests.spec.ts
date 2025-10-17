import { randomUUID } from 'crypto';
import { constructDCMAWAsyncBiometricTokenIssuedDAPEvent } from '../test-events/DCMAWAsyncBiometricTokenIssuedDAPEvent';
import { addMessageToQueue } from '../helpers/aws/sqs/addMessageToQueue';
import {
  generateTimestamp,
  generateTimestampFormatted,
  generateTimestampInMs,
  getIntegrationTestEnv,
} from '../helpers/utils/utils';

describe('Raw to Stage Integration Tests', () => {
  // Create test event - Set uuid()
  // Push test event into queue
  // Wait until test event is processed
  // Verify S3 contains expected object
  // Run raw to stage ETL job
  // Query Athena to validate the event appear in the stage_layer table correctly
  // Delete test data in afterAll()

  const timestamp = generateTimestamp();
  const timestamp_formatted = generateTimestampFormatted();
  const event_timestamp_ms = generateTimestampInMs();
  const event_timestamp_ms_formatted = generateTimestampFormatted();
  const event_id = randomUUID();

  const testEvent = [
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
});
