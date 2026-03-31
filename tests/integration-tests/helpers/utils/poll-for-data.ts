import { PollOptions } from '../../../shared-test-code/poll-for-athena-data';
import { executeAthenaQuery } from '../../../shared-test-code/aws/athena/execute-athena-query';
import { getIntegrationTestEnv } from './utils';
import { DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_TIME_MS } from '../../../shared-test-code/constants';

export const pollForRawLayerReplayData = async (replayIds: string[], options: PollOptions = {}): Promise<void> => {
  const database = getIntegrationTestEnv('RAW_LAYER_DATABASE');
  const tableName = 'txma-refactored';
  await pollForReplayData(replayIds, database, tableName, 'raw layer', options);
};

export const checkStageLayerEventsWithTimestamps = async (eventId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 30000));

  const database = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
  const tableName = 'txma_stage_layer';

  const query = `
    SELECT event_id, timestamp
    FROM "${database}"."${tableName}" 
    WHERE event_id = '${eventId}'
  `;

  const results = await executeAthenaQuery(query, database, 30000);
  const eventCount = results.length - 1;

  if (eventCount === 0) {
    throw new Error(`No events found with event_id ${eventId} in stage layer`);
  }
};

async function pollForReplayData(
  replayIds: string[],
  database: string,
  tableName: string,
  layerName: string,
  options: PollOptions = {},
): Promise<void> {
  const { maxWaitTimeMs = DEFAULT_MAX_WAIT_TIME_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const foundReplayIds = await checkReplayEventsInTable(replayIds, database, tableName);

    if (foundReplayIds.length === replayIds.length) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

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
