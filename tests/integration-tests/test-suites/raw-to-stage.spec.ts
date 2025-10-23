import { getIntegrationTestEnv } from '../helpers/utils/utils';
import { executeAthenaQuery } from '../helpers/aws/athena/execute-athena-query';
import { happyPathEventList } from '../test-events/happy-path-event-list';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { testEventPairs?: typeof happyPathEventList }).testEventPairs || [];

describe('Raw to Stage Integration Tests', () => {
  test('Happy path events should be present in Athena stage layer table', async () => {
    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
    const testEventPairs = getTestEventPairs();

    for (const eventPair of testEventPairs) {
      const event = eventPair.AuditEvent;
      const expectedResults = eventPair.StageLayerEvent;
      const stageLayerQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer" WHERE event_id = '${event.event_id}'`;
      const stageLayerResults = await executeAthenaQuery(stageLayerQuery, stageLayerDatabase);
      // Use flexible matching for processed_time field
      expect(stageLayerResults).toEqual([
        expectedResults[0], // Header row should match exactly
        expect.objectContaining({
          Data: expect.arrayContaining([
            ...expectedResults[1].Data.slice(0, 13), // All fields before processed_time
            { VarCharValue: expect.any(String) }, // processed_time can be any string
            expectedResults[1].Data[14], // processed_dt should match
            expectedResults[1].Data[15], // event_name should match
          ]),
        }),
      ]);
    }
  });

  test('Happy path events should be present in Athena stage layer key values table', async () => {
    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
    const testEventPairs = getTestEventPairs();

    for (const eventPair of testEventPairs) {
      const event = eventPair.AuditEvent;
      const expectedResults = eventPair.StageLayerKeyValues;
      const stageLayerKeyValuesQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer_key_values" WHERE event_id = '${event.event_id}'`;
      const stageLayerKeyValuesResults = await executeAthenaQuery(stageLayerKeyValuesQuery, stageLayerDatabase);
      // Use flexible matching for processed_time and row ordering
      expect(stageLayerKeyValuesResults).toEqual(
        expect.arrayContaining([
          expectedResults[0], // Header row should match exactly
          ...expectedResults.slice(1).map(expectedRow =>
            expect.objectContaining({
              Data: [
                expectedRow.Data[0], // event_id
                expectedRow.Data[1], // parent_column_name
                expectedRow.Data[2], // key
                expectedRow.Data[3], // value
                { VarCharValue: expect.any(String) }, // processed_time
                expectedRow.Data[5], // processed_dt
              ],
            }),
          ),
        ]),
      );
    }
  });
});
