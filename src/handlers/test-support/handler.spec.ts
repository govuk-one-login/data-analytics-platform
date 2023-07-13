import type { TestSupportCommand, TestSupportEnvironment, TestSupportEvent } from './handler';
import { handler } from './handler';
import { mockClient } from 'aws-sdk-client-mock';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { getTestResource, mockS3BodyStream } from '../../shared/utils/test-utils';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import { AthenaClient } from '@aws-sdk/client-athena';
import type { GetQueryResultsOutput } from '@aws-sdk/client-athena';

const mockAthenaClient = mockClient(AthenaClient);
const mockLambdaClient = mockClient(LambdaClient);
const mockS3Client = mockClient(S3Client);

const EXPECTED_S3_BODY = {
  event_id: '8e9d3367-f943-411a-b83d-076ab5b96725',
  event_name: 'DCMAW_CRI_START',
  client_id: '03A5A659-17AA-453F-B905-95D2804823D1',
  component_id: 'https://www.review-b.staging.account.gov.uk',
  user: {
    govuk_signin_journey_id: '63dba1a7-253c-4698-a228-0e3844ddf0f6',
  },
  timestamp: 1684847567,
  timestamp_formatted: '2023-05-23T13:12:47.000Z',
  txma: {
    config_version: '1.2.2',
  },
};

let ATHENA_QUERY_RESULTS: GetQueryResultsOutput;

beforeAll(async () => {
  ATHENA_QUERY_RESULTS = JSON.parse(await getTestResource('athena-query-results.json'));
});

beforeEach(() => {
  mockAthenaClient.reset();
  mockLambdaClient.reset();
  mockS3Client.reset();
});

test('unknown environment', async () => {
  const event = getEvent({ environment: 'NotAnEnv' });
  await expect(handler(event)).rejects.toThrow('Unknown environment "NotAnEnv"');
});

test('unknown command', async () => {
  const event = getEvent({ command: 'NotACommand' });
  await expect(handler(event)).rejects.toThrow('Unknown command "NotACommand"');
});

test('missing input parameter', async () => {
  mockLambdaClient.resolves({});

  const event = getEvent({ input: { FunctionName: 'my-lambda' } });
  await expect(handler(event)).rejects.toThrow('Object is missing the following required fields: Payload');

  expect(mockLambdaClient.calls()).toHaveLength(0);
});

test('client failure', async () => {
  mockLambdaClient.rejects('Lambda error');

  const event = getEvent({ input: { FunctionName: 'my-lambda', Payload: '{}' } });
  await expect(handler(event)).rejects.toThrow('Lambda error');

  expect(mockLambdaClient.calls()).toHaveLength(1);
});

test('success', async () => {
  mockLambdaClient.resolves({});

  const event = getEvent({ input: { FunctionName: 'my-lambda', Payload: '{}' } });
  await expect(handler(event)).resolves.toBeDefined();

  expect(mockLambdaClient.calls()).toHaveLength(1);
});

test('lambda invoke custom response', async () => {
  mockLambdaClient.resolves({
    LogResult:
      'U1RBUlQgUmVxdWVzdElkOiAyMzA5ZDEwNC1iYTkyLTRmOWEtYWFlNy1jYWFkYjY2MzE4MjUgVmVyc2lvbjogJExBVEVTVApFTkQgUmVxdWVzdElkOiAyMzA5ZDEwNC1iYTkyLTRmOWEtYWFlNy1jYWFkYjY2MzE4MjUKUkVQT1JUIFJlcXVlc3RJZDogMjMwOWQxMDQtYmE5Mi00ZjlhLWFhZTctY2FhZGI2NjMxODI1CUR1cmF0aW9uOiAxOC41MCBtcwlCaWxsZWQgRHVyYXRpb246IDE5IG1zCU1lbW9yeSBTaXplOiAxMjggTUIJTWF4IE1lbW9yeSBVc2VkOiA2NyBNQgkK',
    ExecutedVersion: '$LATEST',
    Payload: new Uint8ArrayBlobAdapter([
      123, 34, 115, 116, 97, 116, 117, 115, 67, 111, 100, 101, 34, 58, 50, 48, 48, 44, 34, 98, 111, 100, 121, 34, 58,
      34, 92, 34, 72, 101, 108, 108, 111, 32, 102, 114, 111, 109, 32, 76, 97, 109, 98, 100, 97, 33, 32, 45, 32, 123, 92,
      92, 92, 34, 104, 101, 108, 108, 111, 92, 92, 92, 34, 58, 92, 92, 92, 34, 119, 111, 114, 108, 100, 92, 92, 92, 34,
      125, 92, 34, 34, 125,
    ]),
    StatusCode: 200,
  });

  const event = getEvent({ input: { FunctionName: 'my-lambda', Payload: '{}' } });
  const response = (await handler(event)) as Record<string, unknown>;

  expect(response).toBeDefined();
  expect(response.executedVersion).toEqual('$LATEST');
  expect(response.functionError).toBeUndefined();
  expect(response.statusCode).toEqual(200);
  expect(response.logResult).toEqual(`START RequestId: 2309d104-ba92-4f9a-aae7-caadb6631825 Version: $LATEST
END RequestId: 2309d104-ba92-4f9a-aae7-caadb6631825
REPORT RequestId: 2309d104-ba92-4f9a-aae7-caadb6631825\tDuration: 18.50 ms\tBilled Duration: 19 ms\tMemory Size: 128 MB\tMax Memory Used: 67 MB\t
`);
  expect(response.payload).toEqual({
    statusCode: 200,
    body: '"Hello from Lambda! - {\\"hello\\":\\"world\\"}"',
  });

  expect(mockLambdaClient.calls()).toHaveLength(1);
});

test('lambda invoke custom response error', async () => {
  mockLambdaClient.resolves({
    LogResult:
      'U1RBUlQgUmVxdWVzdElkOiA4ODNlYjdiYy05NmRiLTRjODMtOGE4YS02OGFkMzM3NmJjOTAgVmVyc2lvbjogJExBVEVTVAoyMDIzLTA1LTMwVDEyOjMzOjQwLjE0OVoJODgzZWI3YmMtOTZkYi00YzgzLThhOGEtNjhhZDMzNzZiYzkwCUVSUk9SCUludm9rZSBFcnJvciAJeyJlcnJvclR5cGUiOiJFcnJvciIsImVycm9yTWVzc2FnZSI6IkhlbGxvIHdvcmxkIGVycm9yIiwic3RhY2siOlsiRXJyb3I6IEhlbGxvIHdvcmxkIGVycm9yIiwiICAgIGF0IFJ1bnRpbWUuaGFuZGxlciAoZmlsZTovLy92YXIvdGFzay9pbmRleC5tanM6ODoxMSkiLCIgICAgYXQgUnVudGltZS5oYW5kbGVPbmNlTm9uU3RyZWFtaW5nIChmaWxlOi8vL3Zhci9ydW50aW1lL2luZGV4Lm1qczoxMDg2OjI5KSJdfQpFTkQgUmVxdWVzdElkOiA4ODNlYjdiYy05NmRiLTRjODMtOGE4YS02OGFkMzM3NmJjOTAKUkVQT1JUIFJlcXVlc3RJZDogODgzZWI3YmMtOTZkYi00YzgzLThhOGEtNjhhZDMzNzZiYzkwCUR1cmF0aW9uOiAyNy45NCBtcwlCaWxsZWQgRHVyYXRpb246IDI4IG1zCU1lbW9yeSBTaXplOiAxMjggTUIJTWF4IE1lbW9yeSBVc2VkOiA2NiBNQglJbml0IER1cmF0aW9uOiAxNDMuNzYgbXMJCg==',
    ExecutedVersion: '$LATEST',
    Payload: new Uint8ArrayBlobAdapter([
      123, 34, 101, 114, 114, 111, 114, 84, 121, 112, 101, 34, 58, 34, 69, 114, 114, 111, 114, 34, 44, 34, 101, 114,
      114, 111, 114, 77, 101, 115, 115, 97, 103, 101, 34, 58, 34, 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
      32, 101, 114, 114, 111, 114, 34, 44, 34, 116, 114, 97, 99, 101, 34, 58, 91, 34, 69, 114, 114, 111, 114, 58, 32,
      72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 32, 101, 114, 114, 111, 114, 34, 44, 34, 32, 32, 32, 32, 97,
      116, 32, 82, 117, 110, 116, 105, 109, 101, 46, 104, 97, 110, 100, 108, 101, 114, 32, 40, 102, 105, 108, 101, 58,
      47, 47, 47, 118, 97, 114, 47, 116, 97, 115, 107, 47, 105, 110, 100, 101, 120, 46, 109, 106, 115, 58, 56, 58, 49,
      49, 41, 34, 44, 34, 32, 32, 32, 32, 97, 116, 32, 82, 117, 110, 116, 105, 109, 101, 46, 104, 97, 110, 100, 108,
      101, 79, 110, 99, 101, 78, 111, 110, 83, 116, 114, 101, 97, 109, 105, 110, 103, 32, 40, 102, 105, 108, 101, 58,
      47, 47, 47, 118, 97, 114, 47, 114, 117, 110, 116, 105, 109, 101, 47, 105, 110, 100, 101, 120, 46, 109, 106, 115,
      58, 49, 48, 56, 54, 58, 50, 57, 41, 34, 93, 125,
    ]),
    StatusCode: 200,
    FunctionError: 'Unhandled',
  });

  const event = getEvent({ input: { FunctionName: 'my-lambda', Payload: '{}' } });
  const response = (await handler(event)) as Record<string, unknown>;

  expect(response).toBeDefined();
  expect(response.executedVersion).toEqual('$LATEST');
  expect(response.statusCode).toEqual(200);
  expect(response.functionError).toEqual('Unhandled');
  expect(response.logResult).toEqual(`START RequestId: 883eb7bc-96db-4c83-8a8a-68ad3376bc90 Version: $LATEST
2023-05-30T12:33:40.149Z\t883eb7bc-96db-4c83-8a8a-68ad3376bc90\tERROR\tInvoke Error \t{"errorType":"Error","errorMessage":"Hello world error","stack":["Error: Hello world error","    at Runtime.handler (file:///var/task/index.mjs:8:11)","    at Runtime.handleOnceNonStreaming (file:///var/runtime/index.mjs:1086:29)"]}
END RequestId: 883eb7bc-96db-4c83-8a8a-68ad3376bc90
REPORT RequestId: 883eb7bc-96db-4c83-8a8a-68ad3376bc90\tDuration: 27.94 ms\tBilled Duration: 28 ms\tMemory Size: 128 MB\tMax Memory Used: 66 MB\tInit Duration: 143.76 ms\t
`);
  expect(response.payload).toMatchObject({
    errorType: 'Error',
    errorMessage: 'Hello world error',
  });

  expect(mockLambdaClient.calls()).toHaveLength(1);
});

test('s3 handle text response', async () => {
  const jsonFileContent = await getTestResource('raw-event.json');
  const eTag = '950275989e6e0a4789bda200e8054248';
  const lastModified = new Date(2023, 4, 30, 12, 30);

  mockS3Client.resolves({
    Body: mockS3BodyStream({ stringValue: jsonFileContent }),
    ETag: eTag,
    LastModified: lastModified,
  });

  await testS3Response(eTag, lastModified, undefined);
});

test('s3 handle gzipped response', async () => {
  const gzippedFile = await getTestResource('raw-event.gz', 'binary');
  const eTag = '950275989e6e0a4789bda200e8054248';
  const lastModified = new Date(2023, 4, 30, 12, 30);

  mockS3Client.resolves({
    Body: mockS3BodyStream({ byteValue: Buffer.from(gzippedFile, 'binary') }),
    ETag: eTag,
    LastModified: lastModified,
    ContentEncoding: 'gzip',
  });

  await testS3Response(eTag, lastModified, 'gzip');
});

test('athena success', async () => {
  const queryExecutionId = '1234';

  mockAthenaClient
    .resolvesOnce({ QueryExecutionId: queryExecutionId })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'SUCCEEDED' } } })
    .resolvesOnce(ATHENA_QUERY_RESULTS);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '' },
  });
  const response = (await handler(event)) as GetQueryResultsOutput;

  expect(response).toBeDefined();
  expect(response?.ResultSet?.Rows?.at(1)?.Data?.at(0)?.VarCharValue).toEqual('39.51307483542592');

  expect(mockAthenaClient.calls()).toHaveLength(7);
});

// todo use fake timers to avoid 1s test delay
test('athena wait', async () => {
  const queryExecutionId = '1234';
  const timeoutMs = 1000;
  const runningResponse = { QueryExecution: { Status: { State: 'RUNNING' } } };

  mockAthenaClient.resolvesOnce({ QueryExecutionId: queryExecutionId }).resolves(runningResponse);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '', timeoutMs },
  });
  await expect(handler(event)).rejects.toThrow(
    `Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify(
      runningResponse.QueryExecution.Status,
    )}`,
  );

  expect(mockAthenaClient.calls().length).toBeGreaterThanOrEqual(5);
});

test('athena wait cancellation', async () => {
  const queryExecutionId = '1234';
  const timeoutMs = 5000;
  const cancelledResponse = { QueryExecution: { Status: { State: 'CANCELLED' } } };

  mockAthenaClient
    .resolvesOnce({ QueryExecutionId: queryExecutionId })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce(cancelledResponse);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '', timeoutMs },
  });
  await expect(handler(event)).rejects.toThrow(
    `Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify(
      cancelledResponse.QueryExecution.Status,
    )}`,
  );

  expect(mockAthenaClient.calls()).toHaveLength(5);
});

// todo use fake timers to avoid 1s test delay
test('athena wait failure', async () => {
  const queryExecutionId = '1234';
  const timeoutMs = 1000;
  const failedResponse = { QueryExecution: { Status: { State: 'FAILED', StateChangeReason: 'athena error' } } };

  mockAthenaClient
    .resolvesOnce({ QueryExecutionId: queryExecutionId })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolves(failedResponse);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '', timeoutMs },
  });
  await expect(handler(event)).rejects.toThrow(
    `Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify(
      failedResponse.QueryExecution.Status,
    )}`,
  );

  expect(mockAthenaClient.calls().length).toBeGreaterThanOrEqual(5);
});

test('athena wait failure retry', async () => {
  const queryExecutionId = '1234';
  const timeoutMs = 5000;

  mockAthenaClient
    .resolvesOnce({ QueryExecutionId: queryExecutionId })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'FAILED', StateChangeReason: 'athena error' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'QUEUED' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'SUCCEEDED' } } })
    .resolvesOnce(ATHENA_QUERY_RESULTS);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '', timeoutMs },
  });
  const response = (await handler(event)) as GetQueryResultsOutput;

  expect(response).toBeDefined();
  expect(response?.ResultSet?.Rows?.at(1)?.Data?.at(0)?.VarCharValue).toEqual('39.51307483542592');

  expect(mockAthenaClient.calls()).toHaveLength(10);
});

const getEvent = (overrides: { environment?: string; command?: string; input?: object }): TestSupportEvent => {
  return {
    environment: (overrides.environment ?? 'dev') as TestSupportEnvironment,
    command: (overrides.command ?? 'LAMBDA_INVOKE') as TestSupportCommand,
    input: overrides.input ?? {},
  };
};

const testS3Response = async (
  expectedETag: string,
  expectedLastModified: Date,
  expectedContentEncoding: string | undefined,
): Promise<void> => {
  const event = getEvent({ command: 'S3_GET', input: { Bucket: 'bucket', Key: 'key' } });
  const response = (await handler(event)) as Record<string, unknown>;

  expect(response).toBeDefined();
  expect(JSON.parse(response.body as string)).toEqual(EXPECTED_S3_BODY);
  expect(response.eTag).toEqual(expectedETag);
  expect(response.lastModified).toEqual(expectedLastModified);
  expect(response.contentEncoding).toEqual(expectedContentEncoding);

  expect(mockS3Client.calls()).toHaveLength(1);
};
