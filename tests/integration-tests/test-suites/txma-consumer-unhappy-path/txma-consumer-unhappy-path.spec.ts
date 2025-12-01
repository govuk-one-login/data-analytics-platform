import { checkEventLog } from '../../helpers/aws/cloudwatch/check-invalid-event-log';
import { executeAthenaQuery } from '../../helpers/aws/athena/execute-athena-query';
import { getIntegrationTestEnv } from '../../helpers/utils/utils';

const setupStartTime = Date.now() - 30 * 60 * 1000; // 30 minutes before test start

// Events sent during setup - these should all fail validation
const getUnhappyPathEventPairs = () =>
  (global as { unhappyPathEventPairs?: Array<{ description: string; auditEvent: unknown }> }).unhappyPathEventPairs ||
  [];

describe('TxMA consumer lambda unhappy path tests', () => {
  // Test cases:
  // - Event with no event_name field
  // - Event with no timestamp field
  // - Event with timestamp as string
  // - Event with timestamp in milliseconds
  test.each(getUnhappyPathEventPairs())(
    '$description does not appear in raw layer and txma-event-consumer lambda logs "Invalid audit event"',
    async ({ auditEvent }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventId = (auditEvent as any).event_id;

      const logGroupName = `/aws/lambda/txma-event-consumer`;
      const filterPattern = '"Invalid audit event"';
      const logFound = await checkEventLog(logGroupName, filterPattern, eventId, setupStartTime);
      expect(logFound).toBe(true);

      const rawLayerDatabase = getIntegrationTestEnv('RAW_LAYER_DATABASE');
      const query = `SELECT * FROM "${rawLayerDatabase}"."txma-refactored" WHERE event_id = '${eventId}'`;
      const results = await executeAthenaQuery(query, rawLayerDatabase);
      expect(results.length).toBe(1);
    },
    30000,
  );
});
