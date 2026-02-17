import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { executeAthenaQuery } from '../../helpers/aws/athena/execute-athena-query';
import { happyPathEventList } from '../../test-events/happy-path-events/happy-path-event-list';
import { normaliseJsonInResults } from '../../helpers/utils/normalise-json';
import { Row } from '@aws-sdk/client-athena';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { testEventPairs?: typeof happyPathEventList }).testEventPairs || [];

// Cache for batch query results
let batchResults: Map<string, Row[]> | null = null;

describe('TxMA consumer lambda to raw layer integration tests', () => {
  beforeAll(async () => {
    const testEventPairs = getTestEventPairs();
    const eventIds = testEventPairs.map(pair => pair.auditEvent.event_id);
    const rawLayerDatabase = getIntegrationTestEnv('RAW_LAYER_DATABASE');

    // Single batch query for all events
    const eventIdList = eventIds.map(id => `'${id}'`).join(',');
    const batchQuery = `SELECT * FROM "${rawLayerDatabase}"."txma-refactored" WHERE event_id IN (${eventIdList})`;
    const results = await executeAthenaQuery(batchQuery, rawLayerDatabase);

    // Group results by event_id
    batchResults = new Map();
    const headers = results[0];
    for (let i = 1; i < results.length; i++) {
      const row = results[i];
      const eventId = row.Data?.[0]?.VarCharValue;
      if (eventId) {
        if (!batchResults.has(eventId)) {
          batchResults.set(eventId, [headers]);
        }
        batchResults.get(eventId)!.push(row);
      }
    }
  }, 60000);

  test.each(getTestEventPairs())(
    'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
    async ({ auditEvent, rawLayerEvent }) => {
      const results = batchResults?.get(auditEvent.event_id) || [];
      // Normalize JSON strings to ignore property order
      const normalizedResults = normaliseJsonInResults(results);
      const normalizedExpected = normaliseJsonInResults(rawLayerEvent);
      // Compare expected with actual
      expect(normalizedResults).toEqual(normalizedExpected);
    },
  );
});
