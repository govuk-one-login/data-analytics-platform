import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { executeAthenaQuery } from '../../helpers/aws/athena/execute-athena-query';
import { edgeCaseEventList } from '../../test-events/edge-case-events/edge-case-event-list';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { edgeCaseEventPairs?: typeof edgeCaseEventList }).edgeCaseEventPairs || [];

describe('Raw to Stage Integration Tests', () => {
  test(`Empty client_id field appears in the txma_stage_layer table with value null`, async () => {
    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
    const testEventPairs = getTestEventPairs();

    // Find the dcmaw null fields event by constructor type
    const eventPair = testEventPairs.find(pair => pair.eventType === 'EmptyClientIdEvent')!;
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
    // Check that client_id field appears as empty object in stage layer
    const clientIdColumnIndex = stageLayerResults[0]!.Data!.findIndex(col => col!.VarCharValue === 'client_id');
    expect(stageLayerResults[1]!.Data![clientIdColumnIndex]).toEqual({});
    // Check that event exists in stage layer key values table
    const stageLayerKeyValuesQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer_key_values" WHERE event_id = '${event.event_id}'`;
    const stageLayerKeyValuesResults = await executeAthenaQuery(stageLayerKeyValuesQuery, stageLayerDatabase);
    // eslint-disable-next-line no-console
    console.log('Stage layer key values query results:', JSON.stringify(stageLayerKeyValuesResults, null, 2));
    expect(stageLayerKeyValuesResults.length).toBeGreaterThan(1); // Header + at least 1 data row
  });
});
