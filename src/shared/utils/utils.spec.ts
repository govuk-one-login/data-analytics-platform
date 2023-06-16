import {
  decodeObject,
  encodeObject,
  getRequiredParams,
  parseS3ResponseAsObject,
  parseS3ResponseAsString,
} from './utils';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { mockS3BodyStream } from './test-utils';

/* eslint-disable @typescript-eslint/consistent-type-assertions */
test('get required params correctly errors', () => {
  interface TestType {
    a?: string;
    c?: string;
    e?: string;
  }

  expect(() => getRequiredParams({ a: 'b' }, 'a')).not.toThrow();
  expect(() => getRequiredParams({} as TestType, 'a')).toThrow('Object is missing the following required fields: a');
  expect(() => getRequiredParams({ aa: 'b' } as TestType, 'a')).toThrow(
    'Object is missing the following required fields: a'
  );
  expect(() => getRequiredParams({ a: 'b', c: 'd' } as TestType, 'e')).toThrow(
    'Object is missing the following required fields: e'
  );

  expect(() => getRequiredParams({ a: 'b', c: 'd', e: 'f' }, 'a', 'c', 'e')).not.toThrow();
  expect(() => getRequiredParams({ c: 'd' } as TestType, 'a', 'c', 'e')).toThrow(
    'Object is missing the following required fields: a, e'
  );
  expect(() => getRequiredParams({} as TestType, 'a', 'c', 'e')).toThrow(
    'Object is missing the following required fields: a, c, e'
  );
  expect(() => getRequiredParams({ ee: 'f' } as TestType, 'a', 'c', 'e')).toThrow(
    'Object is missing the following required fields: a, c, e'
  );
});
/* eslint-enable @typescript-eslint/consistent-type-assertions */

test('get required params preserves optional params', () => {
  const requiredOnly = getRequiredParams({ Bucket: 'bucket-name' }, 'Bucket');
  expect(requiredOnly).toEqual({ Bucket: 'bucket-name' });

  const requiredAndOptional = getRequiredParams({ Bucket: 'bucket-name', Prefix: 'prefix' }, 'Bucket');
  expect(requiredAndOptional).toEqual({ Bucket: 'bucket-name', Prefix: 'prefix' });
});

test('get required params errors if field present but null or undefined', () => {
  const presentButNull = { Bucket: 'bucket-name', Prefix: null };
  expect(() => getRequiredParams(presentButNull, 'Bucket', 'Prefix')).toThrow(
    'Object is missing the following required fields: Prefix'
  );

  const presentButUndefined = { Bucket: 'bucket-name', Prefix: undefined };
  expect(() => getRequiredParams(presentButUndefined, 'Bucket', 'Prefix')).toThrow(
    'Object is missing the following required fields: Prefix'
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

const mockS3Response = (body: unknown): GetObjectCommandOutput => {
  return {
    Body: mockS3BodyStream({ stringValue: body }),
    $metadata: {},
  };
};
