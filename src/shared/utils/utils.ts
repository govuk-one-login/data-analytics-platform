/**
 * Requires that an object has the specified properties, throwing an error if not. The returned object
 * is guaranteed to have the required properties, and TypeScript is aware of this due to the return type.
 * @see Pick
 * @see {@link https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys}
 *
 * @param t the object
 * @param requiredParams the properties the object must have
 *
 * @return a <code>Pick</code> type containing the specified properties
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRequiredParams = <T extends Record<string, any>, K extends keyof T>(
  t: T,
  ...requiredParams: K[]
): Pick<T, K> => {
  const missingFields = requiredParams.filter(field => !(field in t));
  if (missingFields.length !== 0) {
    throw new Error(`Object is missing the following required fields: ${missingFields.join(', ')}`);
  }
  return t;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const encodeObject = (object: Record<string, any>): Uint8Array => {
  return Buffer.from(JSON.stringify(object), 'utf-8');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const decodeObject = (encoded: Uint8Array | undefined): Record<string, any> => {
  if (encoded === undefined) {
    throw new Error('Uint8Array to decode was undefined');
  }
  return JSON.parse(Buffer.from(encoded).toString('utf-8'));
};
