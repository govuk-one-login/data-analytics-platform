import { executeAthenaQuery } from './aws/athena/execute-athena-query';
import { getTestEnv } from './utils/get-test-env';
import { DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_TIME_MS } from './constants';

export interface PollOptions {
  maxWaitTimeMs?: number;
  pollIntervalMs?: number;
}

export const pollForRawLayerData = async (
  eventIds: string[],
  options: PollOptions = {},
  timestamps?: number[],
): Promise<void> => {
  const database = getTestEnv('RAW_LAYER_DATABASE');
  const tableName = 'txma-refactored';

  if (timestamps && eventIds.length === 1) {
    await pollForDataWithTimestamps(eventIds[0], timestamps, database, tableName, 'raw layer', options);
  } else {
    await pollForData(eventIds, database, tableName, 'raw layer', options);
  }
};

export const pollForStageLayerData = async (eventIds: string[], options: PollOptions = {}): Promise<void> => {
  const database = getTestEnv('STAGE_LAYER_DATABASE');
  const tableName = 'txma_stage_layer';
  await pollForData(eventIds, database, tableName, 'stage layer', options);
};

async function pollForDataWithTimestamps(
  eventId: string,
  timestamps: number[],
  database: string,
  tableName: string,
  layerName: string,
  options: PollOptions = {},
): Promise<void> {
  const { maxWaitTimeMs = DEFAULT_MAX_WAIT_TIME_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const query = `
      SELECT event_id, timestamp 
      FROM "${database}"."${tableName}" 
      WHERE event_id = '${eventId}' 
      ORDER BY timestamp
    `;

    try {
      const results = await executeAthenaQuery(query, database, 30000);
      const foundTimestamps = results
        .slice(1)
        .map((row: { Data?: { VarCharValue?: string }[] }) => row.Data?.[1]?.VarCharValue)
        .filter((v): v is string => Boolean(v));

      const foundTimestampNumbers = new Set(foundTimestamps.map(ts => Number.parseInt(ts, 10)));
      const allFound = timestamps.every(ts => foundTimestampNumbers.has(ts));

      if (allFound) {
        return;
      }
    } catch {
      // Continue polling
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `Timeout: Not all timestamps found for event ${eventId} in ${layerName} after ${maxWaitTimeMs}ms. ` +
      `Expected timestamps: ${timestamps.join(', ')}`,
  );
}

async function pollForData(
  eventIds: string[],
  database: string,
  tableName: string,
  layerName: string,
  options: PollOptions = {},
): Promise<void> {
  const { maxWaitTimeMs = DEFAULT_MAX_WAIT_TIME_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const foundEventIds = await checkEventsInTable(eventIds, database, tableName);

    if (foundEventIds.length === eventIds.length) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  const finalFoundEventIds = await checkEventsInTable(eventIds, database, tableName);
  const missingEventIds = eventIds.filter(id => !finalFoundEventIds.includes(id));

  throw new Error(
    `Timeout: ${missingEventIds.length}/${eventIds.length} events missing from ${layerName} after ${maxWaitTimeMs}ms. ` +
      `Missing event IDs: ${missingEventIds.join(', ')}`,
  );
}

async function checkEventsInTable(eventIds: string[], database: string, tableName: string): Promise<string[]> {
  const eventIdList = eventIds.map(id => `'${id}'`).join(',');
  const query = `SELECT DISTINCT event_id FROM "${database}"."${tableName}" WHERE event_id IN (${eventIdList})`;

  try {
    const results = await executeAthenaQuery(query, database);
    const foundIds = results
      .slice(1)
      .map((row: { Data?: { VarCharValue?: string }[] }) => row.Data?.[0]?.VarCharValue)
      .filter((v): v is string => Boolean(v));
    return foundIds;
  } catch {
    return [];
  }
}
