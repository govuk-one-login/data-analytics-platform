import { AWS_ENVIRONMENTS } from '../../shared/constants';
import { decodeObject, getAccountId, getRequiredParams } from '../../shared/utils/utils';
import { DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import type { InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { InvokeCommand, ListEventSourceMappingsCommand } from '@aws-sdk/client-lambda';
import type { CopyObjectCommandOutput, DeleteObjectCommandOutput, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { GetQueueUrlCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { cloudwatchClient, firehoseClient, lambdaClient, s3Client, sfnClient, sqsClient } from '../../shared/clients';
import * as zlib from 'zlib';
import { getLogger } from '../../shared/powertools';
import { DescribeExecutionCommand, ListExecutionsCommand, StartExecutionCommand } from '@aws-sdk/client-sfn';
import type { Context } from 'aws-lambda';
import { DescribeDeliveryStreamCommand } from '@aws-sdk/client-firehose';
import { QueryRunner } from './query-runner';

export const logger = getLogger('lambda/test-support');

const TEST_SUPPORT_COMMANDS = [
  'ATHENA_RUN_QUERY',
  'CLOUDWATCH_GET',
  'CLOUDWATCH_LIST',
  'FIREHOSE_DESCRIBE_STREAM',
  'LAMBDA_INVOKE',
  'LAMBDA_LIST_EVENTS',
  'REDSHIFT_RUN_QUERY',
  'S3_COPY',
  'S3_GET',
  'S3_LIST',
  'S3_PUT',
  'SQS_GET_URL',
  'SQS_SEND',
  'SFN_START_EXECUTION',
  'SFN_DESCRIBE_EXECUTION',
  'SFN_LIST_EXECUTIONS',
] as const;

export type TestSupportEnvironment = (typeof AWS_ENVIRONMENTS)[number];

export type TestSupportCommand = (typeof TEST_SUPPORT_COMMANDS)[number];

export interface TestSupportEvent {
  environment: TestSupportEnvironment;
  command: TestSupportCommand;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
}

export interface S3CopyCommandResult {
  copy: CopyObjectCommandOutput;
  delete?: DeleteObjectCommandOutput;
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
      return await new QueryRunner('athena').runQuery(event);
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
    case 'FIREHOSE_DESCRIBE_STREAM': {
      const request = new DescribeDeliveryStreamCommand({
        ...getRequiredParams(event.input, 'DeliveryStreamName'),
      });
      return await firehoseClient.send(request);
    }
    case 'LAMBDA_INVOKE': {
      const request = new InvokeCommand({
        ...getRequiredParams(event.input, 'FunctionName', 'Payload'),
        LogType: 'Tail',
        InvocationType: 'RequestResponse',
      });
      return await lambdaClient.send(request).then(lambdaInvokeResponse);
    }
    case 'LAMBDA_LIST_EVENTS': {
      const request = new ListEventSourceMappingsCommand({
        ...getRequiredParams(event.input, 'FunctionName'),
      });
      return await lambdaClient.send(request);
    }
    case 'REDSHIFT_RUN_QUERY': {
      return await new QueryRunner('redshift').runQuery(event);
    }
    case 'S3_COPY': {
      return await s3Copy(event);
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
    case 'SQS_GET_URL': {
      const request = new GetQueueUrlCommand({
        ...getRequiredParams(event.input, 'QueueName'),
      });
      return await sqsClient.send(request);
    }
    case 'SQS_SEND': {
      const request = new SendMessageCommand({
        ...getRequiredParams(event.input, 'QueueUrl', 'MessageBody'),
      });
      return await sqsClient.send(request);
    }
    case 'SFN_START_EXECUTION': {
      const stateMachineArn = getStateMachineArn(event, context);
      logger.info(`Starting execution of state machine with arn ${stateMachineArn}`);
      return await sfnClient.send(new StartExecutionCommand({ stateMachineArn }));
    }
    case 'SFN_DESCRIBE_EXECUTION': {
      const request = new DescribeExecutionCommand({
        ...getRequiredParams(event.input, 'executionArn'),
      });
      return await sfnClient.send(request);
    }
    case 'SFN_LIST_EXECUTIONS': {
      const stateMachineArn = getStateMachineArn(event, context);
      const request = new ListExecutionsCommand({
        stateMachineArn,
        maxResults: event.input.maxResults ?? 1,
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

const s3Copy = async (event: TestSupportEvent): Promise<S3CopyCommandResult> => {
  const copyRequest = new CopyObjectCommand({
    ...getRequiredParams(event.input, 'Bucket', 'CopySource'),
    Key: getS3CopyKey(event),
  });
  const result: S3CopyCommandResult = { copy: await s3Client.send(copyRequest) };

  if (event.input.DeleteOriginal === true) {
    const deleteRequest = new DeleteObjectCommand(getS3CopyBucketAndKey(event.input.CopySource));
    result.delete = await s3Client.send(deleteRequest);
  }
  return result;
};

const getS3CopyKey = (event: TestSupportEvent): string => {
  if ('Key' in event.input && event.input.Key !== null && event.input.Key !== undefined) {
    return event.input.Key;
  }
  const sourceFile: string = event.input.CopySource;
  return sourceFile.substring(sourceFile.lastIndexOf('/') + 1);
};

const getS3CopyBucketAndKey = (CopySource: string): { Bucket: string; Key: string } => {
  const Bucket = CopySource.split('/').find(s => s.length > 0);
  if (Bucket === undefined) {
    throw new Error(`Cannot get bucket name from given CopySource '${CopySource}'`);
  }
  return { Bucket, Key: CopySource.substring(CopySource.indexOf(Bucket) + Bucket.length + 1) };
};

const getStateMachineArn = (event: TestSupportEvent, context: Context): string => {
  const stateMachineName: string = getRequiredParams(event.input, 'stateMachineName').stateMachineName;
  return `arn:aws:states:eu-west-2:${getAccountId(context)}:stateMachine:${stateMachineName}`;
};
