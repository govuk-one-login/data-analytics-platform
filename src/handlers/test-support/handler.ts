import { AWS_ENVIRONMENTS } from '../../shared/constants';
import { decodeObject, getRequiredParams } from '../../shared/utils/utils';
import { DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import type { InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { athenaClient, cloudwatchClient, lambdaClient, s3Client, sqsClient } from '../../shared/clients';
import * as zlib from 'zlib';
import { GetQueryExecutionCommand, GetQueryResultsCommand, StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import type { GetQueryResultsOutput } from '@aws-sdk/client-athena';
import type { QueryExecutionState } from '@aws-sdk/client-athena/dist-types/models/models_0';

const TEST_SUPPORT_COMMANDS = [
  'ATHENA_RUN_QUERY',
  'CLOUDWATCH_GET',
  'CLOUDWATCH_LIST',
  'LAMBDA_INVOKE',
  'S3_GET',
  'S3_LIST',
  'SQS_SEND',
] as const;

export type TestSupportEnvironment = (typeof AWS_ENVIRONMENTS)[number];

export type TestSupportCommand = (typeof TEST_SUPPORT_COMMANDS)[number];

export interface TestSupportEvent {
  environment: TestSupportEnvironment;
  command: TestSupportCommand;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
}

export const handler = async (event: TestSupportEvent): Promise<unknown> => {
  try {
    console.log(`Test support lambda being called with event ${JSON.stringify(event)}`);
    return await handleEvent(validateEvent(event));
  } catch (error) {
    console.error(`Error calling test support lambda`, error);
    throw error;
  }
};

const validateEvent = (event: TestSupportEvent): TestSupportEvent => {
  if (!TEST_SUPPORT_COMMANDS.includes(event.command)) {
    throw new Error(`Unknown command ${JSON.stringify(event.command)}`);
  }
  if (!AWS_ENVIRONMENTS.includes(event.environment)) {
    throw new Error(`Unknown environment ${JSON.stringify(event.environment)}`);
  }
  return event;
};

const handleEvent = async (event: TestSupportEvent): Promise<unknown> => {
  switch (event.command) {
    case 'ATHENA_RUN_QUERY': {
      return await runAthenaQuery(event);
    }
    case 'CLOUDWATCH_GET': {
      const request = new GetLogEventsCommand({
        ...getRequiredParams(event.input, 'logGroupName', 'logStreamName', 'startTime'),
      });
      return await cloudwatchClient.send(request);
    }
    case 'CLOUDWATCH_LIST': {
      const request = new DescribeLogStreamsCommand({
        ...getRequiredParams(event.input, 'logGroupName'),
      });
      return await cloudwatchClient.send(request);
    }
    case 'LAMBDA_INVOKE': {
      const request = new InvokeCommand({
        ...getRequiredParams(event.input, 'FunctionName', 'Payload'),
        LogType: 'Tail',
        InvocationType: 'RequestResponse',
      });
      return await lambdaClient.send(request).then(lambdaInvokeResponse);
    }
    case 'S3_LIST': {
      const request = new ListObjectsV2Command({
        ...getRequiredParams(event.input, 'Bucket'),
      });
      return await s3Client.send(request);
    }
    case 'S3_GET': {
      const request = new GetObjectCommand({
        ...getRequiredParams(event.input, 'Bucket', 'Key'),
      });
      return await s3Client.send(request).then(s3GetResponse);
    }
    case 'SQS_SEND': {
      const request = new SendMessageCommand({
        ...getRequiredParams(event.input, 'QueueUrl', 'MessageBody'),
      });
      return await sqsClient.send(request);
    }
  }
};

// custom response as real response does not decode Body and has many properties we don't need
const s3GetResponse = async (response: GetObjectCommandOutput): Promise<Record<string, unknown>> => {
  const contentEncoding = response.ContentEncoding;
  const body = await (contentEncoding === 'gzip' ? gzipToString(response) : response.Body?.transformToString('utf-8'));
  return {
    body,
    contentEncoding,
    eTag: response.ETag,
    lastModified: response.LastModified,
  };
};

// custom response as real response LogResult is base64 encoded and Payload is encoded as a UintArray
const lambdaInvokeResponse = async (response: InvokeCommandOutput): Promise<Record<string, unknown>> => {
  return {
    executedVersion: response.ExecutedVersion,
    statusCode: response.StatusCode,
    functionError: response.FunctionError,
    logResult: Buffer.from(response.LogResult ?? '', 'base64').toString('utf-8'),
    payload: decodeObject(response.Payload ?? new Uint8Array([0x7b, 0x7d])),
  };
};

const gzipToString = async (response: GetObjectCommandOutput): Promise<string> => {
  const bytes = await response.Body?.transformToByteArray();
  if (bytes === undefined) {
    throw new Error('Gzipped body is undefined');
  }
  return await new Promise((resolve, reject) => {
    zlib.gunzip(bytes, (error, buffer) => {
      if (error !== null) {
        reject(error);
      } else {
        resolve(buffer.toString('utf8'));
      }
    });
  });
};

const runAthenaQuery = async (event: TestSupportEvent): Promise<unknown> => {
  try {
    const queryExecutionId = await startAthenaQuery(event);
    await waitForAthenaQueryToSucceed(queryExecutionId, event.input.timeoutMs ?? 5000);
    return await getAthenaResults(queryExecutionId);
  } catch (e: any) {
    console.error(`Error executing athena query with input ${JSON.stringify(event.input)}`, e?.message);
    throw e;
  }
};

const startAthenaQuery = async (event: TestSupportEvent): Promise<string | undefined> => {
  const request = new StartQueryExecutionCommand({
    ...getRequiredParams(event.input, 'QueryString', 'QueryExecutionContext', 'WorkGroup'),
  });
  return await athenaClient.send(request).then(response => response.QueryExecutionId);
};

const waitForAthenaQueryToSucceed = async (QueryExecutionId: string | undefined, timeoutMs: number): Promise<void> => {
  let querySuccess = false;
  let state: QueryExecutionState | string = '';
  let timeRemaining = timeoutMs;
  while (!querySuccess && timeRemaining > 0) {
    const response = await athenaClient.send(new GetQueryExecutionCommand({ QueryExecutionId }));
    state = response.QueryExecution?.Status?.State ?? '(missing state)';
    if (state === 'FAILED') {
      throw new Error(`Query failed with reason: ${response.QueryExecution?.Status?.StateChangeReason ?? '(missing reason)'}`);
    } else if (state === 'CANCELLED') {
      throw new Error('Query cancelled');
    } else if (state === 'SUCCEEDED') {
      querySuccess = true;
    } else {
      timeRemaining -= 200;
      await sleep(200);
    }
  }

  if (!querySuccess) {
    throw new Error(`Query did not complete in ${timeoutMs}ms - final state was ${state}`);
  }
};

const sleep = async (ms: number): Promise<unknown> => await new Promise(resolve => setTimeout(resolve, ms));

const getAthenaResults = async (QueryExecutionId: string | undefined): Promise<GetQueryResultsOutput> => {
  const resultsRequest = new GetQueryResultsCommand({ QueryExecutionId });
  return await athenaClient.send(resultsRequest);
};
