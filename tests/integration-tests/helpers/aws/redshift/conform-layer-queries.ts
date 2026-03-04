import { executeRedshiftQuery } from './execute-redshift-query';

interface FactTableResult {
  user_journey_key: number | null;
  event_key: number | null;
  user_key: number | null;
  journey_channel_key: number | null;
  date_key: number | null;
  event_id: string;
  event_time: string;
  count: number;
}

interface ExtensionResult {
  parent_attribute_name: string;
  event_attribute_name: string;
  event_attribute_value: string;
  dup_count: number;
}

export interface FactRow {
  event_id: string;
  component_id: string;
  user_journey_key: number;
  event_key: number;
  user_key: number;
  date_key: number;
  journey_channel_key: number;
}

export interface DimUserJourneyRow {
  user_journey_key: number;
  user_govuk_signin_journey_id: string;
}

export interface DimEventRow {
  event_key: number;
  event_name: string;
}

export interface DimUserRow {
  user_key: number;
  user_id: string;
}

export interface DimJourneyChannelRow {
  journey_channel_key: number;
  channel_name: string;
}

export interface DimDateRow {
  date_key: number;
  date: string;
}

export interface ExtensionRow {
  event_id: string;
  parent_attribute_name: string;
  event_attribute_name: string;
  event_attribute_value: string;
}

export async function getFactTableEventCount(eventId: string): Promise<FactTableResult[]> {
  const query = `
    SELECT event_id, event_time, COUNT(*) as count
    FROM conformed_refactored.fact_user_journey_event_refactored
    WHERE event_id = '${eventId}'
    GROUP BY event_id, event_time
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as FactTableResult[];
}

export async function getExtensionsCount(eventId: string): Promise<number> {
  const query = `
    SELECT COUNT(*) as count
    FROM conformed_refactored.event_extensions_refactored
    WHERE event_id = '${eventId}'
  `;
  const results = await executeRedshiftQuery(query);
  return Number(results[0].count);
}

export async function getDuplicateExtensions(eventId: string): Promise<ExtensionResult[]> {
  const query = `
    SELECT parent_attribute_name, event_attribute_name, event_attribute_value, COUNT(*) as dup_count
    FROM conformed_refactored.event_extensions_refactored
    WHERE event_id = '${eventId}'
    GROUP BY parent_attribute_name, event_attribute_name, event_attribute_value
    HAVING COUNT(*) > 1
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as ExtensionResult[];
}

export async function validateSingleFactEntry(eventId: string, expectedTimestamp: string): Promise<void> {
  const results = await getFactTableEventCount(eventId);
  expect(results.length).toBe(1);
  expect(results[0].count).toBe(1);
  expect(results[0].event_time).toBe(expectedTimestamp);
}

export async function validateNoDuplicateExtensions(eventId: string): Promise<void> {
  const extensionsCount = await getExtensionsCount(eventId);
  const duplicateExtensions = await getDuplicateExtensions(eventId);

  expect(duplicateExtensions.length).toBe(0);
  expect(extensionsCount).toBeGreaterThan(0);
}

export async function validateNoDuplicateDimEntries(eventId: string): Promise<void> {
  // Get the fact row to retrieve foreign keys
  const factResults = await getFactTableEventCount(eventId);
  if (factResults.length === 0) {
    throw new Error(`No fact entry found for event_id: ${eventId}`);
  }
  const fact = factResults[0];

  // Check each dimension table for duplicate entries using the foreign keys
  const dimChecks = [];

  // Check dim_user_journey_event_refactored
  if (fact.user_journey_key) {
    const userJourneyQuery = `
      SELECT COUNT(*) as count
      FROM conformed_refactored.dim_user_journey_event_refactored
      WHERE user_journey_key = ${fact.user_journey_key}
    `;
    dimChecks.push(
      executeRedshiftQuery(userJourneyQuery).then(results => {
        expect(Number(results[0].count)).toBe(1);
      }),
    );
  }

  // Check dim_event_refactored
  if (fact.event_key) {
    const eventQuery = `
      SELECT COUNT(*) as count
      FROM conformed_refactored.dim_event_refactored
      WHERE event_key = ${fact.event_key}
    `;
    dimChecks.push(
      executeRedshiftQuery(eventQuery).then(results => {
        expect(Number(results[0].count)).toBe(1);
      }),
    );
  }

  // Check dim_user_refactored
  if (fact.user_key) {
    const userQuery = `
      SELECT COUNT(*) as count
      FROM conformed_refactored.dim_user_refactored
      WHERE user_key = ${fact.user_key}
    `;
    dimChecks.push(
      executeRedshiftQuery(userQuery).then(results => {
        expect(Number(results[0].count)).toBe(1);
      }),
    );
  }

  // Check dim_journey_channel_refactored
  if (fact.journey_channel_key) {
    const channelQuery = `
      SELECT COUNT(*) as count
      FROM conformed_refactored.dim_journey_channel_refactored
      WHERE journey_channel_key = ${fact.journey_channel_key}
    `;
    dimChecks.push(
      executeRedshiftQuery(channelQuery).then(results => {
        expect(Number(results[0].count)).toBe(1);
      }),
    );
  }

  // Check dim_date_refactored
  if (fact.date_key) {
    const dateQuery = `
      SELECT COUNT(*) as count
      FROM conformed_refactored.dim_date_refactored
      WHERE date_key = ${fact.date_key}
    `;
    dimChecks.push(
      executeRedshiftQuery(dateQuery).then(results => {
        expect(Number(results[0].count)).toBe(1);
      }),
    );
  }

  await Promise.all(dimChecks);
}

export interface ConformLayerCache {
  factCache: Map<string, FactRow>;
  dimUserJourneyCache: Map<number, DimUserJourneyRow>;
  dimEventCache: Map<number, DimEventRow>;
  dimUserCache: Map<number, DimUserRow>;
  dimJourneyChannelCache: Map<number, DimJourneyChannelRow>;
  dimDateCache: Map<number, DimDateRow>;
  extensionsCache: Map<string, ExtensionRow[]>;
}

export async function loadConformLayerCache(eventIds: string[]): Promise<ConformLayerCache> {
  // Query fact table
  const factResults = await batchQueryFactTable(eventIds);
  const factCache = new Map<string, FactRow>();
  factResults.forEach(row => factCache.set(row.event_id, row));

  // Extract foreign keys from fact table
  const userJourneyKeys = [...new Set(factResults.map(r => r.user_journey_key).filter(k => k && !isNaN(k)))];
  const eventKeys = [...new Set(factResults.map(r => r.event_key).filter(k => k && !isNaN(k)))];
  const userKeys = [...new Set(factResults.map(r => r.user_key).filter(k => k && !isNaN(k)))];
  const journeyChannelKeys = [...new Set(factResults.map(r => r.journey_channel_key).filter(k => k && !isNaN(k)))];
  const dateKeys = [...new Set(factResults.map(r => r.date_key).filter(k => k && !isNaN(k)))];

  // Query all dimension tables in parallel
  const [
    dimUserJourneyResults,
    dimEventResults,
    dimUserResults,
    dimJourneyChannelResults,
    dimDateResults,
    extensionsResults,
  ] = await Promise.all([
    batchQueryDimUserJourney(userJourneyKeys),
    batchQueryDimEvent(eventKeys),
    batchQueryDimUser(userKeys),
    batchQueryDimJourneyChannel(journeyChannelKeys),
    batchQueryDimDate(dateKeys),
    batchQueryExtensions(eventIds),
  ]);

  // Build caches
  const dimUserJourneyCache = new Map<number, DimUserJourneyRow>();
  dimUserJourneyResults.forEach(row => dimUserJourneyCache.set(row.user_journey_key, row));

  const dimEventCache = new Map<number, DimEventRow>();
  dimEventResults.forEach(row => dimEventCache.set(row.event_key, row));

  const dimUserCache = new Map<number, DimUserRow>();
  dimUserResults.forEach(row => dimUserCache.set(row.user_key, row));

  const dimJourneyChannelCache = new Map<number, DimJourneyChannelRow>();
  dimJourneyChannelResults.forEach(row => dimJourneyChannelCache.set(row.journey_channel_key, row));

  const dimDateCache = new Map<number, DimDateRow>();
  dimDateResults.forEach(row => dimDateCache.set(row.date_key, row));

  const extensionsCache = new Map<string, ExtensionRow[]>();
  extensionsResults.forEach(row => {
    if (!extensionsCache.has(row.event_id)) {
      extensionsCache.set(row.event_id, []);
    }
    // Exclude event_id from cached data (it's redundant as it's the map key)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { event_id, ...extensionData } = row;
    extensionsCache.get(row.event_id)!.push(extensionData as ExtensionRow);
  });

  return {
    factCache,
    dimUserJourneyCache,
    dimEventCache,
    dimUserCache,
    dimJourneyChannelCache,
    dimDateCache,
    extensionsCache,
  };
}

// Batch query functions for multiple events
export async function batchQueryFactTable(eventIds: string[]): Promise<FactRow[]> {
  const eventIdList = eventIds.map(id => `'${id}'`).join(',');
  const query = `
    SELECT event_id, component_id, user_journey_key, event_key, user_key, date_key, journey_channel_key
    FROM conformed_refactored.fact_user_journey_event_refactored
    WHERE event_id IN (${eventIdList})
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as FactRow[];
}

export async function batchQueryDimUserJourney(keys: number[]): Promise<DimUserJourneyRow[]> {
  if (keys.length === 0) return [];
  const query = `
    SELECT user_journey_key, user_govuk_signin_journey_id
    FROM conformed_refactored.dim_user_journey_event_refactored
    WHERE user_journey_key IN (${keys.join(',')})
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as DimUserJourneyRow[];
}

export async function batchQueryDimEvent(keys: number[]): Promise<DimEventRow[]> {
  if (keys.length === 0) return [];
  const query = `
    SELECT event_key, event_name
    FROM conformed_refactored.dim_event_refactored
    WHERE event_key IN (${keys.join(',')})
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as DimEventRow[];
}

export async function batchQueryDimUser(keys: number[]): Promise<DimUserRow[]> {
  if (keys.length === 0) return [];
  const query = `
    SELECT user_key, user_id
    FROM conformed_refactored.dim_user_refactored
    WHERE user_key IN (${keys.join(',')})
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as DimUserRow[];
}

export async function batchQueryDimJourneyChannel(keys: number[]): Promise<DimJourneyChannelRow[]> {
  if (keys.length === 0) return [];
  const query = `
    SELECT journey_channel_key, channel_name
    FROM conformed_refactored.dim_journey_channel_refactored
    WHERE journey_channel_key IN (${keys.join(',')})
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as DimJourneyChannelRow[];
}

export async function batchQueryDimDate(keys: number[]): Promise<DimDateRow[]> {
  if (keys.length === 0) return [];
  const query = `
    SELECT date_key, date
    FROM conformed_refactored.dim_date_refactored
    WHERE date_key IN (${keys.join(',')})
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as DimDateRow[];
}

export async function batchQueryExtensions(eventIds: string[]): Promise<ExtensionRow[]> {
  const eventIdList = eventIds.map(id => `'${id}'`).join(',');
  const query = `
    SELECT event_id, parent_attribute_name, event_attribute_name, event_attribute_value
    FROM conformed_refactored.event_extensions_refactored
    WHERE event_id IN (${eventIdList})
  `;
  const results = await executeRedshiftQuery(query);
  return results as unknown as ExtensionRow[];
}
