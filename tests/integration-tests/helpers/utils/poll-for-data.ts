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

  console.log(`Starting to poll for ${eventIds.length} events in ${layerName}`);
  console.log(`Database: ${database}, Table: ${tableName}`);
  console.log(`Event IDs: ${eventIds.join(', ')}`);
  console.log(`Max wait time: ${maxWaitTimeMs}ms, Poll interval: ${pollIntervalMs}ms`);

  const startTime = Date.now();
  let attemptCount = 0;

  while (Date.now() - startTime < maxWaitTimeMs) {
    attemptCount++;
    const elapsedTime = Date.now() - startTime;
    console.log(`\nAttempt ${attemptCount} (${Math.round(elapsedTime / 1000)}s elapsed)`);

    const foundEventIds = await checkEventsInTable(eventIds, database, tableName);

    if (foundEventIds.length === eventIds.length) {
      console.log(`✓ All events found after ${attemptCount} attempts in ${Math.round(elapsedTime / 1000)}s`);
      return;
    }

    const missingIds = eventIds.filter(id => !foundEventIds.includes(id));
    console.log(`Found ${foundEventIds.length}/${eventIds.length} events. Missing: ${missingIds.join(', ')}`);

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
    const tableCheckQuery = `SHOW TABLES IN ${database} LIKE '${tableName}'`;
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
    console.log(`Query returned ${results.length} rows:`, JSON.stringify(results, null, 2));
    const foundIds = results
      .slice(1)
      .map(row => row.Data?.[0]?.VarCharValue)
      .filter(Boolean) as string[];
    console.log(`Found event IDs: ${foundIds.join(', ')}`);
    return foundIds;
  } catch (error) {
    console.error(`Query failed:`, error);
    return [];
  }
}
