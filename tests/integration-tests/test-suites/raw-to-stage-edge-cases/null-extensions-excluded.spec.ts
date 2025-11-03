import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { executeAthenaQuery } from '../../helpers/aws/athena/execute-athena-query';
import { edgeCaseEventList } from '../../test-events/edge-case-events/edge-case-event-list';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { edgeCaseEventPairs?: typeof edgeCaseEventList }).edgeCaseEventPairs || [];

describe('Raw to Stage Integration Tests', () => {
  test(`Extensions and txma fields with values null or 'null' are excluded from the txma_stage_layer_key_values table`, async () => {
    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
    const testEventPairs = getTestEventPairs();

    // Find the dcmaw null fields event by constructor type
    const eventPair = testEventPairs.find(pair => pair.eventType === 'NullExtensionTxMAFieldsEvent')!;
    const event = eventPair.auditEvent;
    // Check that event exists in raw layer table
    const rawLayerDatabase = getIntegrationTestEnv('RAW_LAYER_DATABASE');
    const rawLayerQuery = `SELECT * FROM "${rawLayerDatabase}"."txma-refactored" WHERE event_id = '${event.event_id}'`;
    const rawLayerResults = await executeAthenaQuery(rawLayerQuery, rawLayerDatabase);
    // eslint-disable-next-line no-console
    console.log('Raw layer query results:', JSON.stringify(rawLayerResults, null, 2));
    expect(rawLayerResults).toHaveLength(2); // Header + 1 data row
    // Check that event exists in stage layer table
    const stageLayerQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer" WHERE event_id = '${event.event_id}'`;
    const stageLayerResults = await executeAthenaQuery(stageLayerQuery, stageLayerDatabase);
    // eslint-disable-next-line no-console
    console.log('Stage layer query results:', JSON.stringify(stageLayerResults, null, 2));
    expect(stageLayerResults).toHaveLength(2); // Header + 1 data row
    // Check stage layer key values table matches expected results
    const stageLayerKeyValuesQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer_key_values" WHERE event_id = '${event.event_id}'`;
    const stageLayerKeyValuesResults = await executeAthenaQuery(stageLayerKeyValuesQuery, stageLayerDatabase);
    // eslint-disable-next-line no-console
    console.log('Stage layer key values query results:', JSON.stringify(stageLayerKeyValuesResults, null, 2));
    const expectedKeyValuesResults = eventPair.stageLayerKeyValues;
    expect(stageLayerKeyValuesResults.length).toBeGreaterThan(1); // Header + data rows

    if (!expectedKeyValuesResults) {
      throw new Error('Expected key values results not found for NullExtensionTxMAFieldsEvent');
    }

    // Use flexible matching for processed_time and row ordering
    expect(stageLayerKeyValuesResults).toEqual(
      expect.arrayContaining([
        expectedKeyValuesResults[0], // Header row should match exactly
        ...expectedKeyValuesResults.slice(1).map(expectedRow =>
          expect.objectContaining({
            Data: [
              expectedRow.Data[0], // event_id
              expectedRow.Data[1], // parent_column_name
              expectedRow.Data[2], // key
              expectedRow.Data[3], // value
              { VarCharValue: expect.stringMatching(/^\d+$/) }, // processed_time
              expectedRow.Data[5], // processed_dt
            ],
          }),
        ),
      ]),
    );
  });
});
