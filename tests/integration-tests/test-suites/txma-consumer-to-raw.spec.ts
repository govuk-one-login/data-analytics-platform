import { getIntegrationTestEnv } from '../helpers/utils/utils';
import { executeAthenaQuery } from '../helpers/aws/athena/execute-athena-query';
import { happyPathEventList } from '../test-events/happy-path-event-list';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { testEventPairs?: typeof happyPathEventList }).testEventPairs || [];

describe('TxMA consumer lambda to raw layer integration tests', () => {
  test('Happy path events should be present in Athena raw layer table', async () => {
    const testEventPairs = getTestEventPairs();
    for (const eventPair of testEventPairs) {
      const event = eventPair.AuditEvent;
      const expectedResults = eventPair.RawLayerEvent;
      const rawLayerDatabase = getIntegrationTestEnv('RAW_LAYER_DATABASE');
      const query = `SELECT * FROM "${rawLayerDatabase}"."txma-refactored" WHERE event_id = '${event.event_id}'`;
      const results = await executeAthenaQuery(query, rawLayerDatabase);
      // Compare expected with actual
      expect(results).toEqual(expectedResults);
    }
  });
});
