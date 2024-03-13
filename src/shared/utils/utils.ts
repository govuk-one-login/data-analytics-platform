import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { AWS_ENVIRONMENTS } from '../constants';
import type { Context } from 'aws-lambda';
import type { InvokeCommandOutput } from '@aws-sdk/client-lambda';

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
  if (t === null || t === undefined) {
    throw new Error('Object is null or undefined');
  }

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
    throw new Error(`Error parsing JSON string "${body}" - ${getErrorMessage(error)}`);
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

export const getAWSEnvironment = (): (typeof AWS_ENVIRONMENTS)[number] => {
  const environment = getEnvironmentVariable('ENVIRONMENT');
  if (AWS_ENVIRONMENTS.map(e => e.toString()).includes(environment)) {
    return environment as (typeof AWS_ENVIRONMENTS)[number];
  }
  throw new Error(`Invalid environment "${environment}"`);
};

export const isNullUndefinedOrEmpty = (obj: unknown): boolean => {
  if (obj === null || obj === undefined) {
    return true;
  }
  return Array.isArray(obj) && obj.length === 0;
};

export const getAccountId = (context: Context): string => {
  return (
    /:(\d+):function/.exec(context?.invokedFunctionArn)?.at(1) ??
    throwExpression('Error extracting account id from lambda ARN')
  );
};

export interface LambdaInvokeResponse {
  executedVersion?: string;
  statusCode?: number;
  functionError?: string;
  logResult: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
}

// custom response as real response LogResult is base64 encoded and Payload is encoded as a UintArray
export const lambdaInvokeResponse = (response: InvokeCommandOutput): LambdaInvokeResponse => {
  return {
    executedVersion: response.ExecutedVersion,
    statusCode: response.StatusCode,
    functionError: response.FunctionError,
    logResult: Buffer.from(response.LogResult ?? '', 'base64').toString('utf-8'),
    payload: decodeObject(response.Payload ?? new Uint8Array([0x7b, 0x7d])),
  };
};

export const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : JSON.stringify(error);
};

export const arrayPartition = <T>(array: T[], partitionSize: number): T[][] => {
  if (partitionSize < 1) {
    throw new Error('Partition size must be greater than zero');
  }
  return [...Array(Math.round(array.length / partitionSize) + 1).keys()]
    .map(i => i * partitionSize)
    .map(i => array.slice(i, i + partitionSize))
    .filter(chunk => chunk.length > 0);
};

export const ensureDefined = (supplier: () => string | undefined): string => {
  const value = supplier();
  if (value === undefined) {
    const key = supplier.toString().replace('() => ', '');
    throw new Error(`${key} is undefined`);
  }
  return value;
};

export const findOrThrow = <T>(ts: T[], predicate: (value: T, index: number, obj: T[]) => unknown): T => {
  return ts.find(predicate) ?? throwExpression(`Unable to find element matching predicate ${predicate.toString()}`);
};

// see https://stackoverflow.com/a/65666402
const throwExpression = (message: string): never => {
  throw new Error(message);
};
