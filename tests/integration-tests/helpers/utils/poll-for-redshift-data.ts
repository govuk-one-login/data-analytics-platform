/* eslint-disable no-console */
import { executeRedshiftQuery } from '../aws/redshift/execute-redshift-query';

interface PollOptions {
  maxWaitTimeMs?: number;
  pollIntervalMs?: number;
}

export const pollForFactJourneyData = async (eventIds: string[], options: PollOptions = {}): Promise<void> => {
  const { maxWaitTimeMs = 5 * 60 * 1000, pollIntervalMs = 5000 } = options;

  console.log(`Polling for ${eventIds.length} events in fact journey`);

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const foundEventIds = await checkEventsInRedshift(eventIds);
    const missingEventIds = eventIds.filter(id => !foundEventIds.includes(id));

    if (missingEventIds.length === 0) {
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✓ All events found in ${elapsedTime}s`);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  const finalFoundEventIds = await checkEventsInRedshift(eventIds);
  const missingEventIds = eventIds.filter(id => !finalFoundEventIds.includes(id));

  console.error(`Found ${finalFoundEventIds.length} events, missing ${missingEventIds.length} events`);
  console.error(`Missing IDs: ${JSON.stringify(missingEventIds)}`);

  throw new Error(
    `Timeout: ${eventIds.length - finalFoundEventIds.length}/${eventIds.length} events missing from fact journey after ${maxWaitTimeMs}ms. ` +
      `Missing event IDs: ${missingEventIds.join(', ')}`,
  );
};

async function checkEventsInRedshift(eventIds: string[]): Promise<string[]> {
  const eventIdList = eventIds.map(id => `'${id}'`).join(',');
  const query = `SELECT DISTINCT event_id FROM "dap_txma_reporting_db_refactored"."conformed_refactored"."fact_user_journey_event_refactored" WHERE event_id IN (${eventIdList})`;

  try {
    const results = await executeRedshiftQuery(query);
    return results.map(row => row.event_id as string);
  } catch (error) {
    return [];
  }
}
