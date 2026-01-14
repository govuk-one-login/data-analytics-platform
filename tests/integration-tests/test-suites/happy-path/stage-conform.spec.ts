import { executeRedshiftQuery } from '../../helpers/aws/redshift/execute-redshift-query';

const getTestEventPairs = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (global as { testEventPairs?: any[] }).testEventPairs || [];
};

describe('Stage to Conform Integration Tests', () => {
  describe('Fact User Journey Event Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const factQuery = `
          SELECT f.event_id, f.component_id, f.user_journey_key, f.event_key, f.user_key, f.date_key, f.journey_channel_key
          FROM conformed_refactored.fact_user_journey_event_refactored f
          WHERE f.event_id = '${auditEvent.event_id}'
        `;
        const factResults = await executeRedshiftQuery(factQuery);
        expect(factResults).toHaveLength(1);
        const fact = factResults[0];

        expect(fact.event_id).toBe(conformedEvent.fact.event_id);
        expect(fact.component_id).toBe(conformedEvent.fact.component_id);
      },
      10000,
    );
  });

  describe('Dim User Journey Event Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const factQuery = `SELECT user_journey_key FROM conformed_refactored.fact_user_journey_event_refactored WHERE event_id = '${auditEvent.event_id}'`;
        const factResults = await executeRedshiftQuery(factQuery);
        expect(factResults).toHaveLength(1);
        const fact = factResults[0];

        if (!fact.user_journey_key || fact.user_journey_key === '') {
          return;
        }

        const dimUserJourneyQuery = `SELECT user_govuk_signin_journey_id FROM conformed_refactored.dim_user_journey_event_refactored WHERE user_journey_key = ${fact.user_journey_key}`;
        const dimUserJourneyResults = await executeRedshiftQuery(dimUserJourneyQuery);
        expect(dimUserJourneyResults[0]?.user_govuk_signin_journey_id || null).toBe(
          conformedEvent.dimUserJourney.user_govuk_signin_journey_id,
        );
      },
      10000,
    );
  });

  describe('Event Extensions Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const query = `SELECT parent_attribute_name, event_attribute_name, event_attribute_value FROM conformed_refactored.event_extensions_refactored WHERE event_id = '${auditEvent.event_id}'`;
        const results = await executeRedshiftQuery(query);

        expect(results.length).toBe(conformedEvent.extensions?.length || 0);
        expect(results).toEqual(expect.arrayContaining(conformedEvent.extensions || []));
      },
      10000,
    );
  });

  describe('Dim Event Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const factQuery = `SELECT event_key FROM conformed_refactored.fact_user_journey_event_refactored WHERE event_id = '${auditEvent.event_id}'`;
        const factResults = await executeRedshiftQuery(factQuery);
        expect(factResults).toHaveLength(1);
        const fact = factResults[0];

        const dimEventQuery = `SELECT event_name FROM conformed_refactored.dim_event_refactored WHERE event_key = ${fact.event_key}`;
        const dimEventResults = await executeRedshiftQuery(dimEventQuery);
        expect(dimEventResults[0]?.event_name).toBe(conformedEvent.dimEvent.event_name);
      },
      10000,
    );
  });

  describe('Dim User Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        if (!conformedEvent.dimUser) {
          return;
        }

        const factQuery = `SELECT user_key FROM conformed_refactored.fact_user_journey_event_refactored WHERE event_id = '${auditEvent.event_id}'`;
        const factResults = await executeRedshiftQuery(factQuery);
        expect(factResults).toHaveLength(1);
        const fact = factResults[0];

        const dimUserQuery = `SELECT user_id FROM conformed_refactored.dim_user_refactored WHERE user_key = ${fact.user_key}`;
        const dimUserResults = await executeRedshiftQuery(dimUserQuery);
        expect(dimUserResults[0]?.user_id).toBe(conformedEvent.dimUser.user_id);
      },
      10000,
    );
  });

  describe('Dim Journey Channel Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const factQuery = `SELECT journey_channel_key FROM conformed_refactored.fact_user_journey_event_refactored WHERE event_id = '${auditEvent.event_id}'`;
        const factResults = await executeRedshiftQuery(factQuery);
        expect(factResults).toHaveLength(1);
        const fact = factResults[0];

        const dimJourneyChannelQuery = `SELECT channel_name FROM conformed_refactored.dim_journey_channel_refactored WHERE journey_channel_key = ${fact.journey_channel_key}`;
        const dimJourneyChannelResults = await executeRedshiftQuery(dimJourneyChannelQuery);
        expect(dimJourneyChannelResults[0]?.channel_name).toBe(conformedEvent.dimJourneyChannel.channel_name);
      },
      10000,
    );
  });

  describe('Dim Date Table', () => {
    test.each(getTestEventPairs())(
      'Test Event $testEventNumber: $auditEvent.event_name ($auditEvent.event_id)',
      async ({ auditEvent, conformedEvent }) => {
        const factQuery = `SELECT date_key FROM conformed_refactored.fact_user_journey_event_refactored WHERE event_id = '${auditEvent.event_id}'`;
        const factResults = await executeRedshiftQuery(factQuery);
        expect(factResults).toHaveLength(1);
        const fact = factResults[0];

        const dimDateQuery = `SELECT date FROM conformed_refactored.dim_date_refactored WHERE date_key = ${fact.date_key}`;
        const dimDateResults = await executeRedshiftQuery(dimDateQuery);
        expect(dimDateResults[0]?.date).toBe(conformedEvent.dimDate.date);
      },
      10000,
    );
  });
});
