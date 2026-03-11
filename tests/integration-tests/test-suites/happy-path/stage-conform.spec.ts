import { pollForFactJourneyData } from '../../helpers/utils/poll-for-redshift-data';
import { AuditEvent } from '../../../../common/types/event';
import { loadConformLayerCache, ConformLayerCache } from '../../helpers/aws/redshift/conform-layer-queries';

const getTestEventPairs = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (global as { testEventPairs?: any[] }).testEventPairs || [];
};

const getFact = (eventId: string) => {
  const fact = cache?.factCache.get(eventId);
  expect(fact).toBeDefined();
  return fact;
};

// Cache for conform layer data
let cache: ConformLayerCache | null = null;

describe('Stage to Conform Integration Tests', () => {
  beforeAll(
    async () => {
      const testEvents = (global as { testEvents?: AuditEvent[] }).testEvents || [];
      const eventIds = testEvents.map(event => event.event_id);

      // Wait for events to appear in conform layer
      await pollForFactJourneyData(eventIds, { maxWaitTimeMs: 2 * 60 * 1000 });

      // Load all conform layer data into cache
      cache = await loadConformLayerCache(eventIds);
    },
    3 * 60 * 1000,
  );
  describe('Fact User Journey Event Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      ({ auditEvent, conformedEvent }) => {
        const fact = getFact(auditEvent.event_id);
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
      ({ auditEvent, conformedEvent }) => {
        const fact = getFact(auditEvent.event_id);
        if (!fact?.user_journey_key) return;

        const dimUserJourney = cache?.dimUserJourneyCache.get(fact.user_journey_key);
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
      ({ auditEvent, conformedEvent }) => {
        const extensions = cache?.extensionsCache.get(auditEvent.event_id) || [];

        expect(extensions.length).toBe(conformedEvent.extensions?.length || 0);
        expect(extensions).toEqual(expect.arrayContaining(conformedEvent.extensions || []));
      },
      15000,
    );
  });

  describe('Dim Event Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      ({ auditEvent, conformedEvent }) => {
        const fact = getFact(auditEvent.event_id);
        if (!fact) return;

        const dimEvent = cache?.dimEventCache.get(fact.event_key);
        expect(dimEvent?.event_name).toBe(conformedEvent.dimEvent.event_name);
      },
      15000,
    );
  });

  describe('Dim User Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      ({ auditEvent, conformedEvent }) => {
        if (!conformedEvent.dimUser) return;

        const fact = getFact(auditEvent.event_id);
        if (!fact) return;

        const dimUser = cache?.dimUserCache.get(fact.user_key);
        expect(dimUser?.user_id).toBe(conformedEvent.dimUser.user_id);
      },
      15000,
    );
  });

  describe('Dim Journey Channel Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      ({ auditEvent, conformedEvent }) => {
        const fact = getFact(auditEvent.event_id);
        if (!fact) return;

        const dimJourneyChannel = cache?.dimJourneyChannelCache.get(fact.journey_channel_key);
        expect(dimJourneyChannel?.channel_name).toBe(conformedEvent.dimJourneyChannel.channel_name);
      },
      15000,
    );
  });

  describe('Dim Date Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      ({ auditEvent, conformedEvent }) => {
        const fact = getFact(auditEvent.event_id);
        if (!fact) return;

        const dimDate = cache?.dimDateCache.get(fact.date_key);
        expect(dimDate?.date).toBe(conformedEvent.dimDate.date);
      },
      15000,
    );
  });
});
