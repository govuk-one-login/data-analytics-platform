import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { executeAthenaQuery } from '../../helpers/aws/athena/execute-athena-query';
import { edgeCaseEventList } from '../../test-events/edge-case-events/edge-case-event-list';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { edgeCaseEventPairs?: typeof edgeCaseEventList }).edgeCaseEventPairs || [];

describe('Raw to Stage Integration Tests', () => {
  test(`Extensions and txma fields with values null or 'null' are excluded from the txma_stage_layer_key_values table`, async () => {
    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
    const testEventPairs = getTestEventPairs();

    const eventPair = testEventPairs.find(pair => pair.eventType === 'NullExtensionTxMAFieldsEvent')!;
    const event = eventPair.auditEvent;
    const expectedKeyValuesResults = eventPair.stageLayerKeyValues!;

    const stageLayerKeyValuesQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer_key_values" WHERE event_id = '${event.event_id}' ORDER BY parent_column_name, key`;
    const stageLayerKeyValuesResults = await executeAthenaQuery(stageLayerKeyValuesQuery, stageLayerDatabase);

    expect(stageLayerKeyValuesResults[0]).toEqual(expectedKeyValuesResults[0]);
    expect(stageLayerKeyValuesResults).toHaveLength(expectedKeyValuesResults.length);

    stageLayerKeyValuesResults.slice(1).forEach((row, i) => {
      const expected = expectedKeyValuesResults[i + 1].Data;
      expect(row.Data).toMatchObject([
        expected[0], // event_id
        expected[1], // parent_column_name
        expected[2], // key
        expected[3], // value
        { VarCharValue: expect.stringMatching(/^\d+$/) }, // processed_time
        expected[5], // processed_dt
      ]);
    });
  });
});
