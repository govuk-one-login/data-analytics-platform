import { executeAthenaQuery } from '../aws/athena/execute-athena-query';
import { getIntegrationTestEnv } from './utils';
import { DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_TIME_MS } from '../../constants';

interface PollOptions {
  maxWaitTimeMs?: number;
  pollIntervalMs?: number;
}

export const pollForRawLayerData = async (
  eventIds: string[],
  options: PollOptions = {},
  timestamps?: number[],
): Promise<void> => {
  const database = getIntegrationTestEnv('RAW_LAYER_DATABASE');
  const tableName = 'txma-refactored';

  if (timestamps && eventIds.length === 1) {
    await pollForDataWithTimestamps(eventIds[0], timestamps, database, tableName, 'raw layer', options);
  } else {
    await pollForData(eventIds, database, tableName, 'raw layer', options);
  }
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

export const pollForRawLayerEventsWithTimestamps = async (
  eventId: string,
  expectedTimestamps: number[],
  options: PollOptions = {},
): Promise<void> => {
  const { maxWaitTimeMs = 120000, pollIntervalMs = 5000 } = options;
  const database = getIntegrationTestEnv('RAW_LAYER_DATABASE');

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const query = `
      SELECT event_id, timestamp
      FROM "${database}"."txma-refactored" 
      WHERE event_id = '${eventId}'
      ORDER BY timestamp
    `;

    try {
      const results = await executeAthenaQuery(query, database, 30000);
      const eventCount = results.length - 1;

      if (eventCount >= expectedTimestamps.length) {
        const foundTimestamps = results.slice(1).map(row => parseInt(row.Data?.[1]?.VarCharValue || '0'));
        const allTimestampsFound = expectedTimestamps.every(ts => foundTimestamps.includes(ts));

        if (allTimestampsFound) {
          return;
        }
      }
    } catch (error) {
      // Continue polling on error
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Both events with correct timestamps not found in raw layer after ${maxWaitTimeMs / 1000} seconds`);
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
        .map(row => row.Data?.[1]?.VarCharValue)
        .filter(Boolean) as string[];

      const foundTimestampNumbers = foundTimestamps.map(ts => parseInt(ts, 10));
      const allFound = timestamps.every(ts => foundTimestampNumbers.includes(ts));

      if (allFound) {
        return;
      }
    } catch (error) {
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
  const { maxWaitTimeMs = DEFAULT_MAX_WAIT_TIME_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const foundReplayIds = await checkReplayEventsInTable(replayIds, database, tableName);

    if (foundReplayIds.length === replayIds.length) {
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
