import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';

/**
 * Requires that an object has the specified properties (and they are not null or undefined), throwing an error if not.
 * The returned object is guaranteed to have the required properties, and TypeScript is aware of this due to the return type.
 * @see Pick
 * @see Required
 * @see {@link https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys}
 * @see {@link https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype}
 *
 * @param t the object
 * @param requiredParams the properties the object must have
 *
 * @return a <code>Required<Pick></code> type containing the specified properties
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRequiredParams = <T extends Record<string, any>, K extends keyof T>(
  t: T,
  ...requiredParams: K[]
): Required<Pick<T, K>> => {
  const missingFields = requiredParams.filter(field => !(field in t) || t[field] === null || t[field] === undefined);
  if (missingFields.length !== 0) {
    throw new Error(`Object is missing the following required fields: ${missingFields.join(', ')}`);
  }
  return t as unknown as Required<Pick<T, K>>;
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

export const parseS3ResponseAsObject = async <T>(s3Response: GetObjectCommandOutput): Promise<T> => {
  const body = await parseS3ResponseAsString(s3Response);
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(
      `Error parsing JSON string "${body}"${error instanceof Error ? `. Original error: ${error.toString()}` : ''}`
    );
  }
};

export const parseS3ResponseAsString = async (s3Response: GetObjectCommandOutput): Promise<string> => {
  return (await s3Response.Body?.transformToString('utf-8')) ?? throwExpression('S3 response body was undefined');
};

export const getEnvironmentVariable = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`${key} is not defined in this environment`);
  }
  return value;
};

export const sleep = async (ms: number): Promise<unknown> => await new Promise(resolve => setTimeout(resolve, ms));

// see https://stackoverflow.com/a/65666402
const throwExpression = (message: string): never => {
  throw new Error(message);
};
