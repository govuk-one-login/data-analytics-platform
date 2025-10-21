export const flattenObject = (obj: unknown, prefix = ''): Record<string, unknown> => {
  const flattened: Record<string, unknown> = {};

  if (typeof obj !== 'object' || obj === null) {
    return { [prefix]: obj };
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const result = flattenObject(item, `${prefix}[${index}]`);
      Object.keys(result).forEach(key => {
        flattened[key] = result[key];
      });
    });
  } else {
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const result = flattenObject(value, newKey);
      Object.keys(result).forEach(resultKey => {
        flattened[resultKey] = result[resultKey];
      });
    });
  }

  return flattened;
};
