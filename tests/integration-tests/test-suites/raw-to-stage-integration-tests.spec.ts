import { addMessageToQueue } from '../helpers/aws/sqs/addMessageToQueue';
import { getIntegrationTestEnv } from '../helpers/utils/utils';
import { happyPathEventList } from '../test-events/happyPathEventList';
import { executeAthenaQuery } from '../helpers/aws/athena/executeAthenaQuery';

describe('Raw to Stage Integration Tests', () => {
  // Create test event - Set uuid()
  // Push test event into queue
  // Wait until test event is processed
  // (Verify S3 contains expected object)
  // Query Athena to validate the event appear in the raw layer table correctly
  // Run raw to stage ETL job
  // Query Athena to validate the events appear in the stage layer tables correctly
  // Delete test data in afterAll()

  beforeAll(
    async () => {
      for (const event of happyPathEventList) {
        await addMessageToQueue(event, getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL'));
        // eslint-disable-next-line no-console
        console.log('Event added to queue:', JSON.stringify(event, null, 2));
      }

      // Wait for 1 minute
      await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000));
    },
    2 * 60 * 1000,
  ); // 2 minute timeout to account for the 1 minute wait

  test('Events should be present in Athena raw table', async () => {
    for (const event of happyPathEventList) {
      // Query Athena to check if event exists in raw table
      const database = `${process.env.ENVIRONMENT}-txma-raw`;
      const query = `SELECT * FROM "${database}"."txma-refactored" WHERE event_id = '${event.event_id}'`;
      const results = await executeAthenaQuery(query, database);
      expect(results.length).toBe(1); // Event should exist exactly once in raw table
    }
  });
});
