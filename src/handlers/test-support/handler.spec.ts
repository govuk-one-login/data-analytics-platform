import type { S3CopyCommandResult, TestSupportCommand, TestSupportEnvironment, TestSupportEvent } from './handler';
import { handler } from './handler';
import { mockClient } from 'aws-sdk-client-mock';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CopyObjectCommand, DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { getTestResource, mockS3BodyStream } from '../../shared/utils/test-utils';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import type { GetQueryExecutionCommandOutput, GetQueryResultsOutput } from '@aws-sdk/client-athena';
import { AthenaClient } from '@aws-sdk/client-athena';
import type { Context } from 'aws-lambda';
import type { StartExecutionCommand, StartExecutionOutput } from '@aws-sdk/client-sfn';
import { SFNClient } from '@aws-sdk/client-sfn';
import { RedshiftDataClient } from '@aws-sdk/client-redshift-data';
import type { ExecuteStatementCommand, GetStatementResultCommandOutput } from '@aws-sdk/client-redshift-data';
import { FirehoseClient } from '@aws-sdk/client-firehose';
import { SQSClient } from '@aws-sdk/client-sqs';

const mockAthenaClient = mockClient(AthenaClient);
const mockLambdaClient = mockClient(LambdaClient);
const mockRedshiftClient = mockClient(RedshiftDataClient);
const mockS3Client = mockClient(S3Client);
const mockSFNClient = mockClient(SFNClient);

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
let REDSHIFT_QUERY_RESULTS: GetStatementResultCommandOutput;

const CONTEXT: Context = {
  invokedFunctionArn: 'arn:aws:lambda:eu-west-2:123456789012:function:test',
} as unknown as Context;

const REDSHIFT_SECRET_ARN = (process.env.REDSHIFT_SECRET_ARN = 'secret-arn');

beforeAll(async () => {
  ATHENA_QUERY_RESULTS = JSON.parse(await getTestResource('athena-query-results.json'));
  REDSHIFT_QUERY_RESULTS = JSON.parse(await getTestResource('redshift-query-results.json'));
});

beforeEach(() => {
  mockAthenaClient.reset();
  mockLambdaClient.reset();
  mockRedshiftClient.reset();
  mockS3Client.reset();
  mockSFNClient.reset();
});

test('unknown environment', async () => {
  const event = getEvent({ environment: 'NotAnEnv' });
  await expect(handler(event, CONTEXT)).rejects.toThrow('Unknown environment "NotAnEnv"');
});

test('unknown command', async () => {
  const event = getEvent({ command: 'NotACommand' });
  await expect(handler(event, CONTEXT)).rejects.toThrow('Unknown command "NotACommand"');
});

test('missing input parameter', async () => {
  mockLambdaClient.resolves({});

  const event = getEvent({ input: { FunctionName: 'my-lambda' } });
  await expect(handler(event, CONTEXT)).rejects.toThrow('Object is missing the following required fields: Payload');

  expect(mockLambdaClient.calls()).toHaveLength(0);
});

test('client failure', async () => {
  mockLambdaClient.rejects('Lambda error');

  const event = getEvent({ input: { FunctionName: 'my-lambda', Payload: '{}' } });
  await expect(handler(event, CONTEXT)).rejects.toThrow('Lambda error');

  expect(mockLambdaClient.calls()).toHaveLength(1);
});

test('success', async () => {
  mockLambdaClient.resolves({});

  const event = getEvent({ input: { FunctionName: 'my-lambda', Payload: '{}' } });
  await expect(handler(event, CONTEXT)).resolves.toBeDefined();

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
  const response = (await handler(event, CONTEXT)) as Record<string, unknown>;

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
  const response = (await handler(event, CONTEXT)) as Record<string, unknown>;

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
    .resolves(ATHENA_QUERY_RESULTS);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '' },
  });
  const response = (await handler(event, CONTEXT)) as GetQueryResultsOutput;

  expect(response).toBeDefined();
  expect(response?.ResultSet?.Rows?.at(1)?.Data?.at(0)?.VarCharValue).toEqual('39.51307483542592');

  expect(mockAthenaClient.calls()).toHaveLength(7);
});

// todo use fake timers to avoid 1s test delay
test('athena wait', async () => {
  const queryExecutionId = '1234';
  const timeoutMs = 1000;
  const runningResponse = {
    QueryExecution: { Status: { State: 'RUNNING' } },
  } as unknown as GetQueryExecutionCommandOutput;

  mockAthenaClient.resolvesOnce({ QueryExecutionId: queryExecutionId }).resolves(runningResponse);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '', timeoutMs },
  });
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify({
      status: runningResponse.QueryExecution?.Status?.State,
      extraInfo: {},
    })}`,
  );

  expect(mockAthenaClient.calls().length).toBeGreaterThanOrEqual(5);
});

test('athena wait cancellation', async () => {
  const queryExecutionId = '1234';
  const timeoutMs = 5000;
  const cancelledResponse = {
    QueryExecution: { Status: { State: 'CANCELLED' } },
  } as unknown as GetQueryExecutionCommandOutput;

  mockAthenaClient
    .resolvesOnce({ QueryExecutionId: queryExecutionId })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolvesOnce({ QueryExecution: { Status: { State: 'RUNNING' } } })
    .resolves(cancelledResponse);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '', timeoutMs },
  });
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify({
      status: cancelledResponse.QueryExecution?.Status?.State,
      extraInfo: {},
    })}`,
  );

  expect(mockAthenaClient.calls()).toHaveLength(5);
});

// todo use fake timers to avoid 1s test delay
test('athena wait failure', async () => {
  const queryExecutionId = '1234';
  const timeoutMs = 1000;
  const failedResponse = {
    QueryExecution: { Status: { State: 'FAILED', StateChangeReason: 'athena error' } },
  } as unknown as GetQueryExecutionCommandOutput;

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
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify({
      status: failedResponse.QueryExecution?.Status?.State,
      extraInfo: { reason: failedResponse.QueryExecution?.Status?.StateChangeReason },
    })}`,
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
    .resolves(ATHENA_QUERY_RESULTS);

  const event = getEvent({
    command: 'ATHENA_RUN_QUERY',
    input: { QueryString: '', QueryExecutionContext: {}, WorkGroup: '', timeoutMs },
  });
  const response = (await handler(event, CONTEXT)) as GetQueryResultsOutput;

  expect(response).toBeDefined();
  expect(response?.ResultSet?.Rows?.at(1)?.Data?.at(0)?.VarCharValue).toEqual('39.51307483542592');

  expect(mockAthenaClient.calls()).toHaveLength(10);
});

test('s3 put with key', async () => {
  const Bucket = 'some-bucket';
  const Filename = 'file.json';

  mockS3Client
    .rejects()
    .on(PutObjectCommand, { Bucket, Body: Filename, Key: 'renamed-file.json' })
    .resolves({ ETag: 'with key' });

  const event = getEvent({
    command: 'S3_PUT',
    input: { Bucket, Filename, Key: 'renamed-file.json' },
  });
  const response = (await handler(event, CONTEXT)) as PutObjectCommandOutput;
  expect(response).toBeDefined();
  expect(response.ETag).toEqual('with key');
});

test('s3 put without key', async () => {
  const Bucket = 'some-bucket';
  const Filename = 'file.json';

  mockS3Client
    .rejects()
    .on(PutObjectCommand, { Bucket, Body: Filename, Key: 'file.json' })
    .resolves({ ETag: 'without key' });

  const eventWithoutKey = getEvent({
    command: 'S3_PUT',
    input: { Bucket, Filename },
  });
  const response1 = (await handler(eventWithoutKey, CONTEXT)) as PutObjectCommandOutput;
  expect(response1).toBeDefined();
  expect(response1.ETag).toEqual('without key');
});

test('s3 copy with key', async () => {
  const Bucket = 'dest-bucket';
  const CopySource = 'src-bucket/folder/file.json';

  mockS3Client
    .rejects()
    .on(CopyObjectCommand, { Bucket, CopySource, Key: 'renamed-file.json' })
    .resolves({ CopyObjectResult: { ETag: 'with key' } });

  const event = getEvent({
    command: 'S3_COPY',
    input: { Bucket, CopySource, Key: 'renamed-file.json' },
  });
  const response = (await handler(event, CONTEXT)) as S3CopyCommandResult;
  expect(response).toBeDefined();
  expect(response.copy).toBeDefined();
  expect(response.copy.CopyObjectResult?.ETag).toEqual('with key');
  expect(response.delete).not.toBeDefined();
});

test('s3 copy without key', async () => {
  const Bucket = 'dest-bucket';
  const CopySource = 'src-bucket/folder/file.json';

  mockS3Client
    .rejects()
    .on(CopyObjectCommand, { Bucket, CopySource, Key: 'file.json' })
    .resolves({ CopyObjectResult: { ETag: 'without key' } });

  const event = getEvent({
    command: 'S3_COPY',
    input: { Bucket, CopySource },
  });
  const response = (await handler(event, CONTEXT)) as S3CopyCommandResult;
  expect(response).toBeDefined();
  expect(response.copy).toBeDefined();
  expect(response.copy.CopyObjectResult?.ETag).toEqual('without key');
  expect(response.delete).not.toBeDefined();
});

test('s3 copy with delete', async () => {
  const Bucket = 'dest-bucket';
  const CopySource = 'src-bucket/folder/file.json';
  const VersionId = '9_gKg5vG56F.TTEUdwkxGpJ3tNDlWlGq';

  mockS3Client
    .rejects()
    .on(CopyObjectCommand, { Bucket, CopySource, Key: 'file.json' })
    .resolves({ CopyObjectResult: { ETag: 'without key' } })
    .on(DeleteObjectCommand, { Bucket: 'src-bucket', Key: 'folder/file.json' })
    .resolves({ DeleteMarker: false, VersionId });

  const event = getEvent({
    command: 'S3_COPY',
    input: { Bucket, CopySource, DeleteOriginal: true },
  });
  const response = (await handler(event, CONTEXT)) as S3CopyCommandResult;
  expect(response).toBeDefined();
  expect(response.copy).toBeDefined();
  expect(response.copy.CopyObjectResult?.ETag).toEqual('without key');
  expect(response.delete).toBeDefined();
  expect(response.delete?.VersionId).toEqual(VersionId);
});

test('state machine arn from name', async () => {
  const accountId = '123456789012';
  const stateMachineName = 'dev-dap-raw-to-stage-process';

  mockSFNClient.resolves({});

  const event = getEvent({
    command: 'SFN_START_EXECUTION',
    input: { stateMachineName },
  });
  const context = {
    ...CONTEXT,
    invokedFunctionArn: `arn:aws:lambda:eu-west-2:${accountId}:function:LambdaFunctionName`,
  };
  const response = (await handler(event, context)) as StartExecutionOutput;
  expect(response).toBeDefined();

  expect(mockSFNClient.calls()).toHaveLength(1);
  const command = mockSFNClient.call(0).firstArg as StartExecutionCommand;
  expect(command.input.stateMachineArn).toEqual(
    `arn:aws:states:eu-west-2:${accountId}:stateMachine:${stateMachineName}`,
  );
});

test('redshift success', async () => {
  const queryId = '1234';

  mockRedshiftClient
    .resolvesOnce({ Id: queryId })
    .resolvesOnce({ Id: queryId, Status: 'SUBMITTED' })
    .resolvesOnce({ Id: queryId, Status: 'STARTED' })
    .resolvesOnce({ Id: queryId, Status: 'STARTED' })
    .resolvesOnce({ Id: queryId, Status: 'FINISHED' })
    .resolves(REDSHIFT_QUERY_RESULTS);

  const event = getEvent({
    command: 'REDSHIFT_RUN_QUERY',
    input: { Sql: '' },
  });
  const response = (await handler(event, CONTEXT)) as GetStatementResultCommandOutput;

  expect(response).toBeDefined();
  expect(response.Records?.at(0)?.at(0)?.longValue).toEqual(1517);

  expect(mockRedshiftClient.calls()).toHaveLength(6);
  const command = mockRedshiftClient.call(0).firstArg as ExecuteStatementCommand;
  expect(command.input.SecretArn).toEqual(REDSHIFT_SECRET_ARN);
});

test('redshift cancellation', async () => {
  const queryId = '1234';
  const timeoutMs = 1000;
  const cancelledResponse = { Id: queryId, Status: 'ABORTED' };

  mockRedshiftClient
    .resolvesOnce({ Id: queryId })
    .resolvesOnce({ Id: queryId, Status: 'SUBMITTED' })
    .resolvesOnce({ Id: queryId, Status: 'STARTED' })
    .resolvesOnce({ Id: queryId, Status: 'STARTED' })
    .resolves(cancelledResponse);

  const event = getEvent({
    command: 'REDSHIFT_RUN_QUERY',
    input: { Sql: '', timeoutMs },
  });
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify({
      status: cancelledResponse.Status,
    })}`,
  );

  expect(mockRedshiftClient.calls()).toHaveLength(5);
  const command = mockRedshiftClient.call(0).firstArg as ExecuteStatementCommand;
  expect(command.input.SecretArn).toEqual(REDSHIFT_SECRET_ARN);
});

test('redshift failure', async () => {
  const queryId = '1234';
  const timeoutMs = 1000;
  const failedResponse = { Id: queryId, Status: 'FAILED', Error: 'ERROR: permission denied for schema dev_txma_stage' };

  mockRedshiftClient
    .resolvesOnce({ Id: queryId })
    .resolvesOnce({ Id: queryId, Status: 'SUBMITTED' })
    .resolvesOnce({ Id: queryId, Status: 'STARTED' })
    .resolvesOnce({ Id: queryId, Status: 'STARTED' })
    .resolves(failedResponse);

  const event = getEvent({
    command: 'REDSHIFT_RUN_QUERY',
    input: { Sql: '', timeoutMs },
  });
  await expect(handler(event, CONTEXT)).rejects.toThrow(
    `Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify({
      status: failedResponse.Status,
      extraInfo: failedResponse.Error,
    })}`,
  );

  expect(mockRedshiftClient.calls().length).toBeGreaterThanOrEqual(5);
  const command = mockRedshiftClient.call(0).firstArg as ExecuteStatementCommand;
  expect(command.input.SecretArn).toEqual(REDSHIFT_SECRET_ARN);
});

const getEvent = (overrides: { environment?: string; command?: string; input?: object }): TestSupportEvent => {
  return {
    environment: (overrides.environment ?? 'dev') as TestSupportEnvironment,
    command: (overrides.command ?? 'LAMBDA_INVOKE') as TestSupportCommand,
    input: overrides.input ?? {},
  };
};

test('firehose describe stream', async () => {
  const mockFirehoseClient = mockClient(FirehoseClient);
  mockFirehoseClient.resolves({});

  const event = getEvent({
    command: 'FIREHOSE_DESCRIBE_STREAM',
    input: { DeliveryStreamName: 'test-stream' },
  });
  await handler(event, CONTEXT);

  expect(mockFirehoseClient.calls()).toHaveLength(1);
  mockFirehoseClient.reset();
});

test('lambda list events', async () => {
  mockLambdaClient.resolves({});

  const event = getEvent({
    command: 'LAMBDA_LIST_EVENTS',
    input: { FunctionName: 'test-function' },
  });
  await handler(event, CONTEXT);

  expect(mockLambdaClient.calls()).toHaveLength(1);
});

test('s3 list objects', async () => {
  mockS3Client.resolves({});

  const event = getEvent({
    command: 'S3_LIST',
    input: { Bucket: 'test-bucket' },
  });
  await handler(event, CONTEXT);

  expect(mockS3Client.calls()).toHaveLength(1);
});

test('sqs get url', async () => {
  const mockSQSClient = mockClient(SQSClient);
  mockSQSClient.resolves({});

  const event = getEvent({
    command: 'SQS_GET_URL',
    input: { QueueName: 'test-queue' },
  });
  await handler(event, CONTEXT);

  expect(mockSQSClient.calls()).toHaveLength(1);
  mockSQSClient.reset();
});

test('sqs send message', async () => {
  const mockSQSClient = mockClient(SQSClient);
  mockSQSClient.resolves({});

  const event = getEvent({
    command: 'SQS_SEND',
    input: { QueueUrl: 'test-queue-url', MessageBody: 'test message' },
  });
  await handler(event, CONTEXT);

  expect(mockSQSClient.calls()).toHaveLength(1);
  mockSQSClient.reset();
});

test('sfn describe execution', async () => {
  mockSFNClient.resolves({});

  const event = getEvent({
    command: 'SFN_DESCRIBE_EXECUTION',
    input: { executionArn: 'test-execution-arn' },
  });
  await handler(event, CONTEXT);

  expect(mockSFNClient.calls()).toHaveLength(1);
});

test('sfn list executions', async () => {
  mockSFNClient.resolves({});

  const event = getEvent({
    command: 'SFN_LIST_EXECUTIONS',
    input: { stateMachineName: 'test-state-machine' },
  });
  await handler(event, CONTEXT);

  expect(mockSFNClient.calls()).toHaveLength(1);
});

const testS3Response = async (
  expectedETag: string,
  expectedLastModified: Date,
  expectedContentEncoding: string | undefined,
): Promise<void> => {
  const event = getEvent({ command: 'S3_GET', input: { Bucket: 'bucket', Key: 'key' } });
  const response = (await handler(event, CONTEXT)) as Record<string, unknown>;

  expect(response).toBeDefined();
  expect(JSON.parse(response.body as string)).toEqual(EXPECTED_S3_BODY);
  expect(response.eTag).toEqual(expectedETag);
  expect(response.lastModified).toEqual(expectedLastModified);
  expect(response.contentEncoding).toEqual(expectedContentEncoding);

  expect(mockS3Client.calls()).toHaveLength(1);
};
