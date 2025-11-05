/* eslint-disable no-console */
import { executeAthenaQuery } from '../aws/athena/execute-athena-query';
import { getIntegrationTestEnv } from './utils';

interface PollOptions {
  maxWaitTimeMs?: number;
  pollIntervalMs?: number;
}

export const pollForRawLayerData = async (eventIds: string[], options: PollOptions = {}): Promise<void> => {
  const database = getIntegrationTestEnv('RAW_LAYER_DATABASE');
  const tableName = 'txma-refactored';
  await pollForData(eventIds, database, tableName, 'raw layer', options);
};

export const pollForStageLayerData = async (eventIds: string[], options: PollOptions = {}): Promise<void> => {
  const database = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
  const tableName = 'txma_stage_layer';
  await pollForData(eventIds, database, tableName, 'stage layer', options);
};

async function pollForData(
  eventIds: string[],
  database: string,
  tableName: string,
  layerName: string,
  options: PollOptions = {},
): Promise<void> {
  const { maxWaitTimeMs = 5 * 60 * 1000, pollIntervalMs = 10000 } = options;

  console.log(`Polling for ${eventIds.length} events in ${layerName}`);

  // Wait 30 seconds before starting to poll
  await new Promise(resolve => setTimeout(resolve, 30000));

  const startTime = Date.now();
  let attemptCount = 0;

  while (Date.now() - startTime < maxWaitTimeMs) {
    attemptCount++;
    const elapsedTime = Date.now() - startTime;
    console.log(`\nAttempt ${attemptCount} (${Math.round(elapsedTime / 1000)}s elapsed)`);

    const foundEventIds = await checkEventsInTable(eventIds, database, tableName);

    if (foundEventIds.length === eventIds.length) {
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✓ All events found in ${elapsedTime}s`);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  // Provide detailed information about missing events
  const finalFoundEventIds = await checkEventsInTable(eventIds, database, tableName);
  const missingEventIds = eventIds.filter(id => !finalFoundEventIds.includes(id));

  throw new Error(
    `Timeout: ${missingEventIds.length}/${eventIds.length} events missing from ${layerName} after ${maxWaitTimeMs}ms. ` +
      `Missing event IDs: ${missingEventIds.join(', ')}`,
  );
}

async function checkEventsInTable(eventIds: string[], database: string, tableName: string): Promise<string[]> {
  try {
    // Check if table exists first
    const tableCheckQuery = `SHOW TABLES IN "${database}" LIKE '${tableName}'`;
    console.log(`Checking if table exists: ${tableCheckQuery}`);
    const tableExists = await executeAthenaQuery(tableCheckQuery, database);

    if (tableExists.length <= 1) {
      console.log(`Table ${tableName} does not exist in database ${database}`);
      return [];
    }

    const eventIdList = eventIds.map(id => `'${id}'`).join(',');
    const query = `SELECT DISTINCT event_id FROM "${database}"."${tableName}" WHERE event_id IN (${eventIdList})`;

    console.log(`Executing query: ${query}`);
    const results = await executeAthenaQuery(query, database);
    const foundIds = results
      .slice(1)
      .map(row => row.Data?.[0]?.VarCharValue)
      .filter(Boolean) as string[];
    return foundIds;
  } catch (error) {
    console.error(`Query failed:`, error);
    return [];
  }
}
