import { addMessageToQueue } from '../helpers/aws/sqs/addMessageToQueue';
import { getIntegrationTestEnv } from '../helpers/utils/utils';
import { happyPathEventList } from '../test-events/happyPathEventList';
import { executeAthenaQuery } from '../helpers/aws/athena/executeAthenaQuery';
import { executeStepFunction } from '../helpers/aws/state-machine/execute-state-machine';
import { flattenObject } from '../helpers/utils/flattenObject';

describe('Raw to Stage Integration Tests', () => {
  // Create test event - Set uuid()
  // Push test event into queue
  // Wait until test event is processed
  // (Verify S3 contains expected object)
  // Query Athena to validate the event appear in the raw layer table correctly
  // Run raw to stage ETL job
  // Query Athena to validate the events appear in the stage layer tables correctly
  // Delete test data in afterAll()
  let stepFunctionSucceeded = true;
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

      try {
        await executeStepFunction(rawToStageStepFunction);
        stepFunctionSucceeded = true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Step Function failed to complete within 3 minutes:', error);
        stepFunctionSucceeded = false;
      }
    },
    10 * 60 * 1000,
  ); // 10 minute timeout to account for the 3 minute wait + 3 minute step function timeout + buffer

  test('Happy path events should be present in Athena raw layer table', async () => {
    for (const event of happyPathEventList) {
      // Query Athena to check if event exists in raw table
      const rawLayerDatabase = getIntegrationTestEnv('RAW_LAYER_DATABASE');
      const query = `SELECT * FROM "${rawLayerDatabase}"."txma-refactored" WHERE event_id = '${event.event_id}'`;
      const results = await executeAthenaQuery(query, rawLayerDatabase);
      expect(results.length).toBeGreaterThan(1); // Event should exist (accounting for header row)
    }
  });

  test('Happy path events should be present in Athena stage layer table', async () => {
    if (!stepFunctionSucceeded) {
      throw new Error('Step function did not complete successfully. Cannot validate stage layer data.');
    }

    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');

    for (const event of happyPathEventList) {
      const stageLayerQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer" WHERE event_id = '${event.event_id}'`;
      const stageLayerResults = await executeAthenaQuery(stageLayerQuery, stageLayerDatabase);
      expect(stageLayerResults.length).toBeGreaterThan(1); // Event should exist (accounting for header row)
    }
  });

  test('Happy path events should be present in Athena stage layer key values table', async () => {
    if (!stepFunctionSucceeded) {
      throw new Error('Step function did not complete successfully. Cannot validate stage layer key values data.');
    }

    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');

    for (const event of happyPathEventList) {
      const stageLayerKeyValuesQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer_key_values" WHERE event_id = '${event.event_id}'`;
      const stageLayerKeyValuesResults = await executeAthenaQuery(stageLayerKeyValuesQuery, stageLayerDatabase);

      // eslint-disable-next-line no-console
      console.log('Key values query results:', JSON.stringify(stageLayerKeyValuesResults, null, 2));

      // Skip header row (first row)
      const dataRows = stageLayerKeyValuesResults.slice(1);

      // Check extensions fields
      if (event.extensions) {
        // eslint-disable-next-line no-console
        console.log('Looking for extensions:', JSON.stringify(event.extensions, null, 2));

        const flattenedExtensions = flattenObject(event.extensions);

        for (const [key, value] of Object.entries(flattenedExtensions)) {
          const extensionRow = dataRows.find(row => {
            const rowData = (row as Record<string, unknown>).Data as unknown[];
            return (
              (rowData[1] as Record<string, unknown>)?.VarCharValue === 'extensions' &&
              (rowData[2] as Record<string, unknown>)?.VarCharValue === key.toLowerCase() &&
              (rowData[3] as Record<string, unknown>)?.VarCharValue === String(value)
            );
          });
          expect(extensionRow).toBeDefined();
        }
      }

      // Check txma fields - these are flattened in the key-values table
      if (event.txma) {
        // eslint-disable-next-line no-console
        console.log('Looking for txma:', JSON.stringify(event.txma, null, 2));

        const flattenedTxma = flattenObject(event.txma);

        for (const [key, value] of Object.entries(flattenedTxma)) {
          const txmaRow = dataRows.find(row => {
            const rowData = (row as Record<string, unknown>).Data as unknown[];
            return (
              (rowData[1] as Record<string, unknown>)?.VarCharValue === 'txma' &&
              (rowData[2] as Record<string, unknown>)?.VarCharValue === key &&
              (rowData[3] as Record<string, unknown>)?.VarCharValue === String(value)
            );
          });
          expect(txmaRow).toBeDefined();
        }
      }
    }
  });
});
