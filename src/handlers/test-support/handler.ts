import { AWS_ENVIRONMENTS } from '../../shared/constants';
import { decodeObject, getAccountId, getRequiredParams, sleep } from '../../shared/utils/utils';
import { DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import type { InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { CopyObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { athenaClient, cloudwatchClient, lambdaClient, s3Client, sfnClient, sqsClient } from '../../shared/clients';
import * as zlib from 'zlib';
import { GetQueryExecutionCommand, GetQueryResultsCommand, StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import type { GetQueryResultsOutput, QueryExecutionStatus } from '@aws-sdk/client-athena';
import { getLogger } from '../../shared/powertools';
import { DescribeExecutionCommand, StartExecutionCommand } from '@aws-sdk/client-sfn';
import type { Context } from 'aws-lambda';

const logger = getLogger('lambda/test-support');

const TEST_SUPPORT_COMMANDS = [
  'ATHENA_RUN_QUERY',
  'CLOUDWATCH_GET',
  'CLOUDWATCH_LIST',
  'LAMBDA_INVOKE',
  'S3_COPY',
  'S3_GET',
  'S3_LIST',
  'S3_PUT',
  'SQS_SEND',
  'SFN_START_EXECUTION',
  'SFN_DESCRIBE_EXECUTION',
] as const;

export type TestSupportEnvironment = (typeof AWS_ENVIRONMENTS)[number];

export type TestSupportCommand = (typeof TEST_SUPPORT_COMMANDS)[number];

export interface TestSupportEvent {
  environment: TestSupportEnvironment;
  command: TestSupportCommand;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
}

export const handler = async (event: TestSupportEvent, context: Context): Promise<unknown> => {
  try {
    logger.info(`Test support lambda being called with event ${JSON.stringify(event)}`);
    return await handleEvent(validateEvent(event), context);
  } catch (error) {
    logger.error(`Error calling test support lambda`, { error });
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

const handleEvent = async (event: TestSupportEvent, context: Context): Promise<unknown> => {
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
    case 'S3_COPY': {
      const request = new CopyObjectCommand({
        ...getRequiredParams(event.input, 'Bucket', 'CopySource'),
        Key: getS3CopyKey(event),
      });
      return await s3Client.send(request);
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
    case 'S3_PUT': {
      const { Bucket, Filename } = getRequiredParams(event.input, 'Bucket', 'Filename');
      const Key = event.input.Key ?? Filename;
      return await s3Client.send(new PutObjectCommand({ Bucket, Key, Body: Filename }));
    }
    case 'SQS_SEND': {
      const request = new SendMessageCommand({
        ...getRequiredParams(event.input, 'QueueUrl', 'MessageBody'),
      });
      return await sqsClient.send(request);
    }
    case 'SFN_START_EXECUTION': {
      const stateMachineName: string = getRequiredParams(event.input, 'stateMachineName').stateMachineName;
      const stateMachineArn = `arn:aws:states:eu-west-2:${getAccountId(context)}:stateMachine:${stateMachineName}`;
      logger.info(`Starting execution of state machine with arn ${stateMachineArn}`);
      return await sfnClient.send(new StartExecutionCommand({ stateMachineArn }));
    }
    case 'SFN_DESCRIBE_EXECUTION': {
      const request = new DescribeExecutionCommand({
        ...getRequiredParams(event.input, 'executionArn'),
      });
      return await sfnClient.send(request);
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
  } catch (e) {
    logger.error(`Error executing athena query with input ${JSON.stringify(event.input)}`, { e });
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
  let status: QueryExecutionStatus | undefined;
  let timeRemaining = timeoutMs;
  while (timeRemaining > 0) {
    status = await athenaClient
      .send(new GetQueryExecutionCommand({ QueryExecutionId }))
      .then(response => response.QueryExecution?.Status);

    // return if SUCCEEDED to stop waiting, break if CANCELLED to allow error to be thrown
    // don't break if FAILED as athena may retry and put back in QUEUED
    if (status?.State === 'SUCCEEDED') {
      return;
    } else if (status?.State === 'CANCELLED') {
      break;
    }
    timeRemaining -= 200;
    await sleep(200);
  }
  throw new Error(`Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify(status)}`);
};

const getAthenaResults = async (QueryExecutionId: string | undefined): Promise<GetQueryResultsOutput> => {
  const resultsRequest = new GetQueryResultsCommand({ QueryExecutionId });
  return await athenaClient.send(resultsRequest);
};

const getS3CopyKey = (event: TestSupportEvent): string => {
  if ('Key' in event.input && event.input.Key !== null && event.input.Key !== undefined) {
    return event.input.Key;
  }
  const sourceFile: string = event.input.CopySource;
  return sourceFile.substring(sourceFile.lastIndexOf('/') + 1);
};
