import { S3Client } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { AWS_CLIENT_BASE_CONFIG } from './constants';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { SQSClient } from '@aws-sdk/client-sqs';
import { FirehoseClient } from '@aws-sdk/client-firehose';
import { ConfiguredRetryStrategy } from '@smithy/util-retry';
import { AthenaClient } from '@aws-sdk/client-athena';
import { SFNClient } from '@aws-sdk/client-sfn';
import { RedshiftDataClient } from '@aws-sdk/client-redshift-data';
import { EC2Client } from '@aws-sdk/client-ec2';

export const athenaClient = new AthenaClient(AWS_CLIENT_BASE_CONFIG);

export const cloudwatchClient = new CloudWatchLogsClient(AWS_CLIENT_BASE_CONFIG);

export const ec2Client = new EC2Client(AWS_CLIENT_BASE_CONFIG);

export const firehoseClient = new FirehoseClient({
  ...AWS_CLIENT_BASE_CONFIG,
  retryStrategy: new ConfiguredRetryStrategy(3, retryAttempt => Math.pow(2, retryAttempt) * 1000),
});

export const lambdaClient = new LambdaClient(AWS_CLIENT_BASE_CONFIG);

export const redshiftClient = new RedshiftDataClient(AWS_CLIENT_BASE_CONFIG);

export const s3Client = new S3Client(AWS_CLIENT_BASE_CONFIG);

export const sqsClient = new SQSClient(AWS_CLIENT_BASE_CONFIG);

export const sfnClient = new SFNClient(AWS_CLIENT_BASE_CONFIG);
