import { executeRedshiftQuery } from '../../helpers/aws/redshift/execute-redshift-query';
import { pollForFactJourneyData } from '../../helpers/utils/poll-for-redshift-data';
import { AuditEvent } from '../../../../common/types/event';

const getTestEventPairs = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (global as { testEventPairs?: any[] }).testEventPairs || [];
};

// Cache for batch query results
interface FactRow {
  event_id: string;
  component_id: string;
  user_journey_key: number;
  event_key: number;
  user_key: number;
  date_key: number;
  journey_channel_key: number;
}

let factCache: Map<string, FactRow> | null = null;
let dimUserJourneyCache: Map<number, { user_govuk_signin_journey_id: string }> | null = null;
let dimEventCache: Map<number, { event_name: string }> | null = null;
let dimUserCache: Map<number, { user_id: string }> | null = null;
let dimJourneyChannelCache: Map<number, { channel_name: string }> | null = null;
let dimDateCache: Map<number, { date: string }> | null = null;
let extensionsCache: Map<
  string,
  Array<{ parent_attribute_name: string; event_attribute_name: string; event_attribute_value: string }>
> | null = null;

describe('Stage to Conform Integration Tests', () => {
  beforeAll(
    async () => {
      const testEvents = (global as { testEvents?: AuditEvent[] }).testEvents || [];
      const eventIds = testEvents.map(event => event.event_id);
      await pollForFactJourneyData(eventIds, { maxWaitTimeMs: 2 * 60 * 1000 });

      const eventIdList = eventIds.map(id => `'${id}'`).join(',');

      // Batch query fact table
      const factQuery = `
        SELECT event_id, component_id, user_journey_key, event_key, user_key, date_key, journey_channel_key
        FROM conformed_refactored.fact_user_journey_event_refactored
        WHERE event_id IN (${eventIdList})
      `;
      const factResults = await executeRedshiftQuery(factQuery);
      factCache = new Map();
      factResults.forEach(row => {
        factCache!.set(String(row.event_id), row as unknown as FactRow);
      });

      // Collect all keys for dimension tables
      const userJourneyKeys = [
        ...new Set(factResults.map(r => Number(r.user_journey_key)).filter(k => k && !isNaN(k))),
      ];
      const eventKeys = [...new Set(factResults.map(r => Number(r.event_key)).filter(k => k && !isNaN(k)))];
      const userKeys = [...new Set(factResults.map(r => Number(r.user_key)).filter(k => k && !isNaN(k)))];
      const journeyChannelKeys = [
        ...new Set(factResults.map(r => Number(r.journey_channel_key)).filter(k => k && !isNaN(k))),
      ];
      const dateKeys = [...new Set(factResults.map(r => Number(r.date_key)).filter(k => k && !isNaN(k)))];

      // Batch query dimension tables
      if (userJourneyKeys.length > 0) {
        const dimUserJourneyQuery = `
          SELECT user_journey_key, user_govuk_signin_journey_id
          FROM conformed_refactored.dim_user_journey_event_refactored
          WHERE user_journey_key IN (${userJourneyKeys.join(',')})
        `;
        const dimUserJourneyResults = await executeRedshiftQuery(dimUserJourneyQuery);
        dimUserJourneyCache = new Map();
        dimUserJourneyResults.forEach(row => {
          dimUserJourneyCache!.set(Number(row.user_journey_key), {
            user_govuk_signin_journey_id: String(row.user_govuk_signin_journey_id),
          });
        });
      }

      if (eventKeys.length > 0) {
        const dimEventQuery = `
          SELECT event_key, event_name
          FROM conformed_refactored.dim_event_refactored
          WHERE event_key IN (${eventKeys.join(',')})
        `;
        const dimEventResults = await executeRedshiftQuery(dimEventQuery);
        dimEventCache = new Map();
        dimEventResults.forEach(row => {
          dimEventCache!.set(Number(row.event_key), { event_name: String(row.event_name) });
        });
      }

      if (userKeys.length > 0) {
        const dimUserQuery = `
          SELECT user_key, user_id
          FROM conformed_refactored.dim_user_refactored
          WHERE user_key IN (${userKeys.join(',')})
        `;
        const dimUserResults = await executeRedshiftQuery(dimUserQuery);
        dimUserCache = new Map();
        dimUserResults.forEach(row => {
          dimUserCache!.set(Number(row.user_key), { user_id: String(row.user_id) });
        });
      }

      if (journeyChannelKeys.length > 0) {
        const dimJourneyChannelQuery = `
          SELECT journey_channel_key, channel_name
          FROM conformed_refactored.dim_journey_channel_refactored
          WHERE journey_channel_key IN (${journeyChannelKeys.join(',')})
        `;
        const dimJourneyChannelResults = await executeRedshiftQuery(dimJourneyChannelQuery);
        dimJourneyChannelCache = new Map();
        dimJourneyChannelResults.forEach(row => {
          dimJourneyChannelCache!.set(Number(row.journey_channel_key), { channel_name: String(row.channel_name) });
        });
      }

      if (dateKeys.length > 0) {
        const dimDateQuery = `
          SELECT date_key, date
          FROM conformed_refactored.dim_date_refactored
          WHERE date_key IN (${dateKeys.join(',')})
        `;
        const dimDateResults = await executeRedshiftQuery(dimDateQuery);
        dimDateCache = new Map();
        dimDateResults.forEach(row => {
          dimDateCache!.set(Number(row.date_key), { date: String(row.date) });
        });
      }

      // Batch query extensions
      const extensionsQuery = `
        SELECT event_id, parent_attribute_name, event_attribute_name, event_attribute_value
        FROM conformed_refactored.event_extensions_refactored
        WHERE event_id IN (${eventIdList})
      `;
      const extensionsResults = await executeRedshiftQuery(extensionsQuery);
      extensionsCache = new Map();
      extensionsResults.forEach(row => {
        const eventId = String(row.event_id);
        if (!extensionsCache!.has(eventId)) {
          extensionsCache!.set(eventId, []);
        }
        extensionsCache!.get(eventId)!.push({
          parent_attribute_name: String(row.parent_attribute_name),
          event_attribute_name: String(row.event_attribute_name),
          event_attribute_value: String(row.event_attribute_value),
        });
      });
    },
    3 * 60 * 1000,
  );
  describe('Fact User Journey Event Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const fact = factCache?.get(auditEvent.event_id);
        expect(fact).toBeDefined();
        if (!fact) return;
        expect(fact.event_id).toBe(conformedEvent.fact.event_id);
        expect(fact.component_id).toBe(conformedEvent.fact.component_id);
      },
      15000,
    );
  });

  describe('Dim User Journey Event Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const fact = factCache?.get(auditEvent.event_id);
        expect(fact).toBeDefined();
        if (!fact) return;

        if (!fact.user_journey_key) {
          return;
        }

        const dimUserJourney = dimUserJourneyCache?.get(Number(fact.user_journey_key));
        expect(dimUserJourney?.user_govuk_signin_journey_id || null).toBe(
          conformedEvent.dimUserJourney.user_govuk_signin_journey_id,
        );
      },
      15000,
    );
  });

  describe('Event Extensions Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const extensions = extensionsCache?.get(auditEvent.event_id) || [];
        expect(extensions.length).toBe(conformedEvent.extensions?.length || 0);
        expect(extensions).toEqual(expect.arrayContaining(conformedEvent.extensions || []));
      },
      15000,
    );
  });

  describe('Dim Event Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const fact = factCache?.get(auditEvent.event_id);
        expect(fact).toBeDefined();
        if (!fact) return;

        const dimEvent = dimEventCache?.get(Number(fact.event_key));
        expect(dimEvent?.event_name).toBe(conformedEvent.dimEvent.event_name);
      },
      15000,
    );
  });

  describe('Dim User Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        if (!conformedEvent.dimUser) {
          return;
        }

        const fact = factCache?.get(auditEvent.event_id);
        expect(fact).toBeDefined();
        if (!fact) return;

        const dimUser = dimUserCache?.get(Number(fact.user_key));
        expect(dimUser?.user_id).toBe(conformedEvent.dimUser.user_id);
      },
      15000,
    );
  });

  describe('Dim Journey Channel Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const fact = factCache?.get(auditEvent.event_id);
        expect(fact).toBeDefined();
        if (!fact) return;

        const dimJourneyChannel = dimJourneyChannelCache?.get(Number(fact.journey_channel_key));
        expect(dimJourneyChannel?.channel_name).toBe(conformedEvent.dimJourneyChannel.channel_name);
      },
      15000,
    );
  });

  describe('Dim Date Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const fact = factCache?.get(auditEvent.event_id);
        expect(fact).toBeDefined();
        if (!fact) return;

        const dimDate = dimDateCache?.get(Number(fact.date_key));
        expect(dimDate?.date).toBe(conformedEvent.dimDate.date);
      },
      15000,
    );
  });
});
