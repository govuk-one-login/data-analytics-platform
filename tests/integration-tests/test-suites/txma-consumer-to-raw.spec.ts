import { getIntegrationTestEnv } from '../helpers/utils/utils';
import { executeAthenaQuery } from '../helpers/aws/athena/execute-athena-query';
import { happyPathEventList } from '../test-events/happy-path-event-list';
import { Row } from '@aws-sdk/client-athena';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { testEventPairs?: typeof happyPathEventList }).testEventPairs || [];

// Helper to normalize JSON strings for comparison (ignores property order and type differences)
const normalizeJson = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(normalizeJson);
  }
  if (obj && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .forEach(key => {
        sorted[key] = normalizeJson((obj as Record<string, unknown>)[key]);
      });
    return sorted;
  }
  // Convert numbers to strings for consistent comparison
  if (typeof obj === 'number') {
    return String(obj);
  }
  return obj;
};

const normalizeJsonInResults = (results: Row[]) => {
  return results.map(row => ({
    ...row,
    Data: row.Data?.map(item => {
      if (
        item.VarCharValue &&
        typeof item.VarCharValue === 'string' &&
        (item.VarCharValue.startsWith('{') || item.VarCharValue.startsWith('['))
      ) {
        try {
          const parsed = JSON.parse(item.VarCharValue);
          const normalized = normalizeJson(parsed);
          return { VarCharValue: JSON.stringify(normalized) };
        } catch {
          return item;
        }
      }
      return item;
    }),
  }));
};

describe('TxMA consumer lambda to raw layer integration tests', () => {
  test('Happy path events should be present in Athena raw layer table', async () => {
    const testEventPairs = getTestEventPairs();
    for (const eventPair of testEventPairs) {
      const event = eventPair.auditEvent;
      const expectedResults = eventPair.rawLayerEvent;
      const rawLayerDatabase = getIntegrationTestEnv('RAW_LAYER_DATABASE');
      const query = `SELECT * FROM "${rawLayerDatabase}"."txma-refactored" WHERE event_id = '${event.event_id}'`;
      const results = await executeAthenaQuery(query, rawLayerDatabase);
      // Normalize JSON strings to ignore property order
      const normalizedResults = normalizeJsonInResults(results);
      const normalizedExpected = normalizeJsonInResults(expectedResults);
      // Compare expected with actual
      expect(normalizedResults).toEqual(normalizedExpected);
    }
  });
});
