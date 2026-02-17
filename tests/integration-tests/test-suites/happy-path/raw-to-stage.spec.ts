import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { executeAthenaQuery } from '../../helpers/aws/athena/execute-athena-query';
import { happyPathEventList } from '../../test-events/happy-path-events/happy-path-event-list';
import { pollForStageLayerData } from '../../helpers/utils/poll-for-athena-data';
import { AuditEvent } from '../../../../common/types/event';
import { Row } from '@aws-sdk/client-athena';

// Get events that were processed during setup
const getTestEventPairs = () => (global as { testEventPairs?: typeof happyPathEventList }).testEventPairs || [];

// Cache for batch query results
let stageLayerBatchResults: Map<string, Row[]> | null = null;
let stageLayerKeyValuesBatchResults: Map<string, Row[]> | null = null;

describe('Raw to Stage Integration Tests', () => {
  beforeAll(
    async () => {
      const testEvents = (global as { testEvents?: AuditEvent[] }).testEvents || [];
      const eventIds = testEvents.map(event => event.event_id);
      await pollForStageLayerData(eventIds, { maxWaitTimeMs: 2 * 60 * 1000 });

      const stageLayerDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
      const eventIdList = eventIds.map(id => `'${id}'`).join(',');

      // Batch query for stage layer table
      const stageLayerQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer" WHERE event_id IN (${eventIdList})`;
      const stageLayerResults = await executeAthenaQuery(stageLayerQuery, stageLayerDatabase);

      // Group stage layer results by event_id
      stageLayerBatchResults = new Map();
      const stageHeaders = stageLayerResults[0];
      for (let i = 1; i < stageLayerResults.length; i++) {
        const row = stageLayerResults[i];
        const eventId = row.Data?.[0]?.VarCharValue;
        if (eventId) {
          if (!stageLayerBatchResults.has(eventId)) {
            stageLayerBatchResults.set(eventId, [stageHeaders]);
          }
          stageLayerBatchResults.get(eventId)!.push(row);
        }
      }

      // Batch query for stage layer key values table
      const stageLayerKeyValuesQuery = `SELECT * FROM "${stageLayerDatabase}"."txma_stage_layer_key_values" WHERE event_id IN (${eventIdList}) ORDER BY event_id, parent_column_name, key`;
      const keyValuesResults = await executeAthenaQuery(stageLayerKeyValuesQuery, stageLayerDatabase);

      // Group key values results by event_id
      stageLayerKeyValuesBatchResults = new Map();
      const keyValuesHeaders = keyValuesResults[0];
      for (let i = 1; i < keyValuesResults.length; i++) {
        const row = keyValuesResults[i];
        const eventId = row.Data?.[0]?.VarCharValue;
        if (eventId) {
          if (!stageLayerKeyValuesBatchResults.has(eventId)) {
            stageLayerKeyValuesBatchResults.set(eventId, [keyValuesHeaders]);
          }
          stageLayerKeyValuesBatchResults.get(eventId)!.push(row);
        }
      }
    },
    3 * 60 * 1000,
  );
  describe('Stage Layer Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, stageLayerEvent }) => {
        const stageLayerResults = stageLayerBatchResults?.get(auditEvent.event_id) || [];

        expect(stageLayerResults[0]).toEqual(stageLayerEvent[0]);
        expect(stageLayerResults).toHaveLength(stageLayerEvent.length);

        const expected = stageLayerEvent[1].Data;
        expect(stageLayerResults[1].Data).toMatchObject([
          ...expected.slice(0, 13), // All fields before processed_time
          { VarCharValue: expect.stringMatching(/^\d+$/) }, // processed_time
          expected[14], // processed_dt
          expected[15], // event_name
        ]);
      },
    );
  });

  describe('Stage Layer Key Values Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, stageLayerKeyValues }) => {
        const stageLayerKeyValuesResults = stageLayerKeyValuesBatchResults?.get(auditEvent.event_id) || [];

        if (stageLayerKeyValues) {
          expect(stageLayerKeyValuesResults[0]).toEqual(stageLayerKeyValues[0]);
          expect(stageLayerKeyValuesResults).toHaveLength(stageLayerKeyValues.length);

          expect(stageLayerKeyValuesResults.slice(1)).toEqual(
            expect.arrayContaining(
              stageLayerKeyValues.slice(1).map((expectedRow: { Data: { VarCharValue: string }[] }) => ({
                Data: [
                  expectedRow.Data[0], // event_id
                  expectedRow.Data[1], // parent_column_name
                  expectedRow.Data[2], // key
                  expectedRow.Data[3], // value
                  { VarCharValue: expect.stringMatching(/^\d+$/) }, // processed_time
                  expectedRow.Data[5], // processed_dt
                ],
              })),
            ),
          );
        }
      },
    );
  });
});
