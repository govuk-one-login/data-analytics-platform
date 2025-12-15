/* eslint-disable no-console */
import { executeRedshiftQuery } from '../aws/redshift/execute-redshift-query';

interface PollOptions {
  maxWaitTimeMs?: number;
  pollIntervalMs?: number;
}

export const pollForFactJourneyData = async (eventIds: string[], options: PollOptions = {}): Promise<void> => {
  const { maxWaitTimeMs = 5 * 60 * 1000, pollIntervalMs = 10000 } = options;

  console.log(`Polling for ${eventIds.length} events in fact journey`);

  await new Promise(resolve => setTimeout(resolve, 30000));

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const foundEventIds = await checkEventsInRedshift(eventIds);

    if (foundEventIds.length === eventIds.length) {
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✓ All events found in ${elapsedTime}s`);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  const finalFoundEventIds = await checkEventsInRedshift(eventIds);
  const missingEventIds = eventIds.filter(id => !finalFoundEventIds.includes(id));

  throw new Error(
    `Timeout: ${missingEventIds.length}/${eventIds.length} events missing from fact journey after ${maxWaitTimeMs}ms. ` +
      `Missing event IDs: ${missingEventIds.join(', ')}`,
  );
};

async function checkEventsInRedshift(eventIds: string[]): Promise<string[]> {
  const eventIdList = eventIds.map(id => `'${id}'`).join(',');
  const query = `SELECT DISTINCT event_id FROM conformed_refactored.fact_user_journey_event_refactored WHERE event_id IN (${eventIdList})`;

  try {
    return await executeRedshiftQuery(query, 'dap_txma_reporting_db_refactored');
  } catch (error) {
    return [];
  }
}
