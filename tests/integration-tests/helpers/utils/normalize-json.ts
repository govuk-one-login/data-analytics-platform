import { Row } from '@aws-sdk/client-athena';

// Helper to normalize JSON strings for comparison (ignores property order and type differences)
const normalizeJson = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(normalizeJson);
  }
  if (obj && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .forEach(key => {
        sorted[key] = normalizeJson((obj as Record<string, unknown>)[key]);
      });
    return sorted;
  }
  // Convert numbers to strings for consistent comparison
  if (typeof obj === 'number') {
    return String(obj);
  }
  return obj;
};

export const normalizeJsonInResults = (results: Row[]) => {
  return results.map(row => ({
    ...row,
    Data: row.Data?.map(item => {
      if (
        item.VarCharValue &&
        typeof item.VarCharValue === 'string' &&
        (item.VarCharValue.startsWith('{') || item.VarCharValue.startsWith('['))
      ) {
        try {
          const parsed = JSON.parse(item.VarCharValue);
          const normalized = normalizeJson(parsed);
          return { VarCharValue: JSON.stringify(normalized) };
        } catch {
          return item;
        }
      }
      return item;
    }),
  }));
};
