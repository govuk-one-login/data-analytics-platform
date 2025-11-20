import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { executeAthenaQuery } from '../../helpers/aws/athena/execute-athena-query';
import { edgeCaseEventList } from '../../test-events/edge-case-events/edge-case-event-list';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { edgeCaseEventPairs?: typeof edgeCaseEventList }).edgeCaseEventPairs || [];

describe('Raw to Stage Integration Tests', () => {
  test(`Empty client_id field appears in the txma_stage_layer table with value null`, async () => {
    const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
    const testEventPairs = getTestEventPairs();

    const eventPair = testEventPairs.find(pair => pair.eventType === 'EmptyClientIdEvent')!;
    const event = eventPair.auditEvent;

    const stageLayerQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer" WHERE event_id = '${event.event_id}'`;
    const stageLayerResults = await executeAthenaQuery(stageLayerQuery, stageLayerDatabase);

    const clientIdColumnIndex = stageLayerResults[0]!.Data!.findIndex(col => col!.VarCharValue === 'client_id');
    expect(stageLayerResults[1]!.Data![clientIdColumnIndex]).toEqual({});
  });
});
