import {
  arrayPartition,
  decodeObject,
  encodeObject,
  ensureDefined,
  findOrThrow,
  getAccountId,
  getAWSEnvironment,
  getEnvironmentVariable,
  getS3EventRecords,
  getRequiredParams,
  isNullUndefinedOrEmpty,
  parseS3ResponseAsObject,
  parseS3ResponseAsString,
} from './utils';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { mockS3BodyStream } from './test-utils';
import type { Context, S3Event } from 'aws-lambda';

test('get required params correctly errors', () => {
  interface TestType {
    a?: string;
    c?: string;
    e?: string;
  }

  expect(() => getRequiredParams({ a: 'b' }, 'a')).not.toThrow();
  expect(() => getRequiredParams({} as TestType, 'a')).toThrow('Object is missing the following required fields: a');
  expect(() => getRequiredParams({ aa: 'b' } as TestType, 'a')).toThrow(
    'Object is missing the following required fields: a',
  );
  expect(() => getRequiredParams({ a: 'b', c: 'd' } as TestType, 'e')).toThrow(
    'Object is missing the following required fields: e',
  );

  expect(() => getRequiredParams({ a: 'b', c: 'd', e: 'f' }, 'a', 'c', 'e')).not.toThrow();
  expect(() => getRequiredParams({ c: 'd' } as TestType, 'a', 'c', 'e')).toThrow(
    'Object is missing the following required fields: a, e',
  );
  expect(() => getRequiredParams({} as TestType, 'a', 'c', 'e')).toThrow(
    'Object is missing the following required fields: a, c, e',
  );
  expect(() => getRequiredParams({ ee: 'f' } as TestType, 'a', 'c', 'e')).toThrow(
    'Object is missing the following required fields: a, c, e',
  );
});

test('get required params preserves optional params', () => {
  const requiredOnly = getRequiredParams({ Bucket: 'bucket-name' }, 'Bucket');
  expect(requiredOnly).toEqual({ Bucket: 'bucket-name' });

  const requiredAndOptional = getRequiredParams({ Bucket: 'bucket-name', Prefix: 'prefix' }, 'Bucket');
  expect(requiredAndOptional).toEqual({ Bucket: 'bucket-name', Prefix: 'prefix' });
});

test('get required params errors if field present but null or undefined', () => {
  const presentButNull = { Bucket: 'bucket-name', Prefix: null };
  expect(() => getRequiredParams(presentButNull, 'Bucket', 'Prefix')).toThrow(
    'Object is missing the following required fields: Prefix',
  );

  const presentButUndefined = { Bucket: 'bucket-name', Prefix: undefined };
  expect(() => getRequiredParams(presentButUndefined, 'Bucket', 'Prefix')).toThrow(
    'Object is missing the following required fields: Prefix',
  );
});

test('get required params errors if object is null or undefined', () => {
  expect(() => getRequiredParams(null as unknown as Record<string, unknown>, 'Bucket')).toThrow(
    'Object is null or undefined',
  );

  expect(() => getRequiredParams(undefined as unknown as Record<string, unknown>, 'Bucket')).toThrow(
    'Object is null or undefined',
  );
});

test('encode and decode', () => {
  const testObject = { a: 'b', c: true, d: 42 };

  const encoded = encodeObject(testObject);
  expect(encoded).toBeDefined();
  expect(encoded).not.toHaveLength(0);

  const decoded = decodeObject(encoded);
  expect(decoded).toBeDefined();
  expect(decoded).toEqual(testObject);
});

test('parse s3 response as string', async () => {
  await expect(parseS3ResponseAsString(mockS3Response('hi'))).resolves.toEqual('hi');
  await expect(parseS3ResponseAsString(mockS3Response(null))).rejects.toThrow('S3 response body was undefined');
  await expect(parseS3ResponseAsString(mockS3Response(undefined))).rejects.toThrow('S3 response body was undefined');
});

test('parse s3 response as object', async () => {
  await expect(parseS3ResponseAsObject(mockS3Response('{}'))).resolves.toEqual({});
  await expect(parseS3ResponseAsObject(mockS3Response('[1,2,3]'))).resolves.toEqual([1, 2, 3]);
  const testObject = { a: 'b', c: true, d: 42 };
  await expect(parseS3ResponseAsObject(mockS3Response('{"a":"b","c":true,"d":42}'))).resolves.toEqual(testObject);
  await expect(parseS3ResponseAsObject(mockS3Response(null))).rejects.toThrow('S3 response body was undefined');
  await expect(parseS3ResponseAsObject(mockS3Response(undefined))).rejects.toThrow('S3 response body was undefined');
});

test('get environment variable', () => {
  process.env.ENV_VAR = 'hello';
  expect(getEnvironmentVariable('ENV_VAR')).toEqual('hello');

  process.env.ENV_VAR = '';
  expect(() => getEnvironmentVariable('ENV_VAR')).toThrow('ENV_VAR is not defined in this environment');

  delete process.env.ENV_VAR;
  expect(() => getEnvironmentVariable('ENV_VAR')).toThrow('ENV_VAR is not defined in this environment');

  expect(() => getEnvironmentVariable('MISSING_ENV_VAR')).toThrow('MISSING_ENV_VAR is not defined in this environment');
});

test('get aws environment', () => {
  const oldEnvironment = process.env.ENVIRONMENT;

  process.env.ENVIRONMENT = 'integration';
  expect(getAWSEnvironment()).toEqual('integration');

  process.env.ENVIRONMENT = '';
  expect(() => getAWSEnvironment()).toThrow('ENVIRONMENT is not defined in this environment');

  delete process.env.ENV_VAR;
  expect(() => getAWSEnvironment()).toThrow('ENVIRONMENT is not defined in this environment');

  process.env.ENVIRONMENT = 'invalid';
  expect(() => getAWSEnvironment()).toThrow('Invalid environment "invalid"');

  process.env.ENVIRONMENT = oldEnvironment;
});

test('null undefined or empty', () => {
  expect(isNullUndefinedOrEmpty(null)).toEqual(true);
  expect(isNullUndefinedOrEmpty(undefined)).toEqual(true);
  expect(isNullUndefinedOrEmpty([])).toEqual(true);
  expect(isNullUndefinedOrEmpty(({} as unknown as Record<string, string>).property)).toEqual(true);

  expect(isNullUndefinedOrEmpty({})).toEqual(false);
  expect(isNullUndefinedOrEmpty([null])).toEqual(false);
  expect(isNullUndefinedOrEmpty(false)).toEqual(false);
});

test('get account id', () => {
  const accountId = '123456789012';
  const validArnValidAccountId = mockContext(`arn:aws:lambda:eu-west-2:${accountId}:function:LambdaFunctionName`);
  expect(getAccountId(validArnValidAccountId)).toEqual(accountId);

  const invalidArnValidAccountId = mockContext(`arn:aws:lambda:eu-west-2:ABCD1234:function:LambdaFunctionName`);
  expect(() => getAccountId(invalidArnValidAccountId)).toThrow('Error extracting account id from lambda ARN');

  const invalidArn = mockContext(`this is an invalid arn`);
  expect(() => getAccountId(invalidArn)).toThrow('Error extracting account id from lambda ARN');

  expect(() => getAccountId(null as unknown as Context)).toThrow('Error extracting account id from lambda ARN');
  expect(() => getAccountId(undefined as unknown as Context)).toThrow('Error extracting account id from lambda ARN');
});

test('array partition', () => {
  expect(arrayPartition([1, 2, 3, 4, 5, 6], 2)).toEqual(
    expect.arrayContaining([
      [1, 2],
      [3, 4],
      [5, 6],
    ]),
  );
  expect(arrayPartition([1, 2, 3, 4, 5, 6], 3)).toEqual(
    expect.arrayContaining([
      [1, 2, 3],
      [4, 5, 6],
    ]),
  );
  expect(arrayPartition([1, 2, 3, 4, 5, 6], 4)).toEqual(
    expect.arrayContaining([
      [1, 2, 3, 4],
      [5, 6],
    ]),
  );
  expect(arrayPartition([1, 2, 3, 4, 5, 6], 5)).toEqual(expect.arrayContaining([[1, 2, 3, 4, 5], [6]]));
});

test('ensure defined', () => {
  const response = { one: 'one', two: undefined };
  expect(ensureDefined(() => response.one)).toEqual('one');
  expect(() => ensureDefined(() => response.two)).toThrow('two is undefined');
});

test('find or throw', () => {
  expect(findOrThrow([1, 2, 3, 4], n => n === 2)).toEqual(2);
  expect(() => findOrThrow([1, 2, 3, 4], n => n === 8)).toThrow(
    'Unable to find element matching predicate (n)=>n === 8',
  );
});

test('get s3 event records', () => {
  const asS3Event = (u: unknown): S3Event => u as S3Event;
  expect(() => getS3EventRecords(asS3Event({ Records: null }))).toThrow('Missing event or records');
  expect(() => getS3EventRecords(asS3Event({ Records: undefined }))).toThrow('Missing event or records');
  expect(() => getS3EventRecords({ Records: [] })).toThrow('Missing event or records');
  expect(() => getS3EventRecords(asS3Event({}))).toThrow('Missing event or records');
  expect(() => getS3EventRecords(asS3Event(null))).toThrow('Missing event or records');
  expect(() => getS3EventRecords(asS3Event(undefined))).toThrow('Missing event or records');

  expect(getS3EventRecords(asS3Event({ Records: [1, 2, 3] }))).toEqual([1, 2, 3]);
});

const mockS3Response = (body: unknown): GetObjectCommandOutput => {
  return {
    Body: mockS3BodyStream({ stringValue: body }),
    $metadata: {},
  };
};

const mockContext = (invokedFunctionArn: string): Context => {
  return { invokedFunctionArn } as unknown as Context;
};
