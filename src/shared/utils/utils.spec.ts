import { decodeObject, encodeObject, getRequiredParams } from './utils';

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

test('encode and decode', () => {
  const encoded = encodeObject({ a: 'b', c: true, d: 42 });
  expect(encoded).toBeDefined();
  expect(encoded).not.toHaveLength(0);

  const decoded = decodeObject(encoded);
  expect(decoded).toBeDefined();
  expect(decoded).toEqual({ a: 'b', c: true, d: 42 });
});
