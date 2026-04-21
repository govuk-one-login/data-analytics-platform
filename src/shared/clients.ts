import { S3Client } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { AWS_CLIENT_BASE_CONFIG, AWS_REGION } from './constants';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { SQSClient } from '@aws-sdk/client-sqs';
import { FirehoseClient } from '@aws-sdk/client-firehose';
import { ConfiguredRetryStrategy } from '@smithy/util-retry';
import { AthenaClient } from '@aws-sdk/client-athena';
import { SFNClient } from '@aws-sdk/client-sfn';
import { RedshiftDataClient } from '@aws-sdk/client-redshift-data';
import { QuickSightClient } from '@aws-sdk/client-quicksight';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { RedshiftServerlessClient } from '@aws-sdk/client-redshift-serverless';
import { SNSClient } from '@aws-sdk/client-sns';

export const athenaClient = new AthenaClient(AWS_CLIENT_BASE_CONFIG);

export const cognitoClient = new CognitoIdentityProviderClient(AWS_CLIENT_BASE_CONFIG);

export const cloudwatchClient = new CloudWatchLogsClient(AWS_CLIENT_BASE_CONFIG);

export const eventbridgeClient = new EventBridgeClient(AWS_CLIENT_BASE_CONFIG);

export const firehoseClient = new FirehoseClient({
  ...AWS_CLIENT_BASE_CONFIG,
  retryStrategy: new ConfiguredRetryStrategy(3, retryAttempt => Math.pow(2, retryAttempt) * 1000),
});

export const lambdaClient = new LambdaClient(AWS_CLIENT_BASE_CONFIG);

export const quicksightClient = new QuickSightClient(AWS_CLIENT_BASE_CONFIG);

export const redshiftDataClient = new RedshiftDataClient(AWS_CLIENT_BASE_CONFIG);

export const redshiftServerlessClient = new RedshiftServerlessClient(AWS_CLIENT_BASE_CONFIG);

export const s3Client = new S3Client(AWS_CLIENT_BASE_CONFIG);

export const secretsManagerClient = new SecretsManagerClient(AWS_CLIENT_BASE_CONFIG);

export const sqsClient = new SQSClient(AWS_CLIENT_BASE_CONFIG);

export const sfnClient = new SFNClient(AWS_CLIENT_BASE_CONFIG);

export const snsClient = new SNSClient({
  region: AWS_REGION,
  requestHandler: {
    requestTimeout: 10000, // 10 seconds
  },
});
