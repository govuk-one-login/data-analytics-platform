import { executeRedshiftQuery } from '../aws/redshift/execute-redshift-query';
import { DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_TIME_MS } from '../../constants';

interface PollOptions {
  maxWaitTimeMs?: number;
  pollIntervalMs?: number;
}

export const pollForFactJourneyData = async (eventIds: string[], options: PollOptions = {}): Promise<void> => {
  const { maxWaitTimeMs = DEFAULT_MAX_WAIT_TIME_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const foundEventIds = await checkEventsInRedshift(eventIds);
    const missingEventIds = eventIds.filter(id => !foundEventIds.includes(id));

    if (missingEventIds.length === 0) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  const finalFoundEventIds = await checkEventsInRedshift(eventIds);
  const missingEventIds = eventIds.filter(id => !finalFoundEventIds.includes(id));

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
