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

export const pollForRawLayerReplayData = async (replayIds: string[], options: PollOptions = {}): Promise<void> => {
  const database = getIntegrationTestEnv('RAW_LAYER_DATABASE');
  const tableName = 'txma-refactored';
  await pollForReplayData(replayIds, database, tableName, 'raw layer', options);
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
  const { maxWaitTimeMs = 5 * 60 * 1000, pollIntervalMs = 5000 } = options;

  console.log(`Polling for ${eventIds.length} events in ${layerName}`);

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
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
  const eventIdList = eventIds.map(id => `'${id}'`).join(',');
  const query = `SELECT DISTINCT event_id FROM "${database}"."${tableName}" WHERE event_id IN (${eventIdList})`;

  try {
    const results = await executeAthenaQuery(query, database);
    const foundIds = results
      .slice(1)
      .map(row => row.Data?.[0]?.VarCharValue)
      .filter(Boolean) as string[];
    return foundIds;
  } catch (error) {
    return [];
  }
}

async function pollForReplayData(
  replayIds: string[],
  database: string,
  tableName: string,
  layerName: string,
  options: PollOptions = {},
): Promise<void> {
  const { maxWaitTimeMs = 5 * 60 * 1000, pollIntervalMs = 5000 } = options;

  console.log(`Polling for ${replayIds.length} replay events in ${layerName}`);

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const foundReplayIds = await checkReplayEventsInTable(replayIds, database, tableName);

    if (foundReplayIds.length === replayIds.length) {
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✓ All replay events found in ${elapsedTime}s`);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  // Provide detailed information about missing events
  const finalFoundReplayIds = await checkReplayEventsInTable(replayIds, database, tableName);
  const missingReplayIds = replayIds.filter(id => !finalFoundReplayIds.includes(id));

  throw new Error(
    `Timeout: ${missingReplayIds.length}/${replayIds.length} replay events missing from ${layerName} after ${maxWaitTimeMs}ms. ` +
      `Missing replay IDs: ${missingReplayIds.join(', ')}`,
  );
}

async function checkReplayEventsInTable(replayIds: string[], database: string, tableName: string): Promise<string[]> {
  const replayIdConditions = replayIds.map(id => `txma like '%${id}%'`).join(' OR ');
  const query = `SELECT DISTINCT txma FROM "${database}"."${tableName}" WHERE ${replayIdConditions}`;

  try {
    const results = await executeAthenaQuery(query, database);
    const foundIds: string[] = [];

    results.slice(1).forEach(row => {
      const txmaValue = row.Data?.[0]?.VarCharValue;
      if (txmaValue) {
        replayIds.forEach(replayId => {
          if (txmaValue.includes(replayId) && !foundIds.includes(replayId)) {
            foundIds.push(replayId);
          }
        });
      }
    });

    return foundIds;
  } catch (error) {
    return [];
  }
}
