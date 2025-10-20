import { addMessageToQueue } from '../helpers/aws/sqs/addMessageToQueue';
import { getIntegrationTestEnv } from '../helpers/utils/utils';
import { happyPathEventList } from '../test-events/happyPathEventList';
import { executeAthenaQuery } from '../helpers/aws/athena/executeAthenaQuery';
import { executeStepFunction } from '../helpers/aws/state-machine/execute-state-machine';

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

      const rawToStageStepFunction = getIntegrationTestEnv('RAW_TO_STAGE_STEP_FUNCTION');

      executeStepFunction(rawToStageStepFunction);
    },
    2 * 60 * 1000,
  ); // 2 minute timeout to account for the 1 minute wait

  test('Happy path events should be present in Athena raw layer table', async () => {
    for (const event of happyPathEventList) {
      // Query Athena to check if event exists in raw table
      const rawLayerDatabase = getIntegrationTestEnv('RAW_LAYER_DATABASE');
      const query = `SELECT * FROM "${rawLayerDatabase}"."txma-refactored" WHERE event_id = '${event.event_id}'`;
      const results = await executeAthenaQuery(query, rawLayerDatabase);
      expect(results.length).toBe(1); // Event should exist exactly once in raw table
    }
  });

  test('Happy path events should be present in Athena stage layer table', async () => {
    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');

    for (const event of happyPathEventList) {
      const stageLayerQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer" WHERE event_id = '${event.event_id}'`;
      const stageLayerResults = await executeAthenaQuery(stageLayerQuery, stageLayerDatabase);
      expect(stageLayerResults.length).toBe(1); // Event should exist exactly once in stage table
    }
  });

  test('Happy path events should be present in Athena stage layer key values table', async () => {
    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');

    for (const event of happyPathEventList) {
      const stageLayerKeyValuesQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer_key_values" WHERE event_id = '${event.event_id}'`;
      const stageLayerKeyValuesResults = await executeAthenaQuery(stageLayerKeyValuesQuery, stageLayerDatabase);
      // Check extensions fields
      if (event.extensions) {
        for (const [key, value] of Object.entries(event.extensions)) {
          const extensionRow = stageLayerKeyValuesResults.find(
            row =>
              (row as Record<string, unknown>)['parent_column_name'] === 'extensions' &&
              (row as Record<string, unknown>)['key'] === key &&
              (row as Record<string, unknown>)['value'] === String(value),
          );
          expect(extensionRow).toBeDefined();
        }
      }

      // Check txma fields
      if (event.txma) {
        for (const [key, value] of Object.entries(event.txma)) {
          const txmaRow = stageLayerKeyValuesResults.find(
            row =>
              (row as Record<string, unknown>)['parent_column_name'] === 'txma' &&
              (row as Record<string, unknown>)['key'] === key &&
              (row as Record<string, unknown>)['value'] === String(value),
          );
          expect(txmaRow).toBeDefined();
        }
      }
    }
  });
});
