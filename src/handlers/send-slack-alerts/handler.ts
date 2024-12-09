import { getLogger } from '../../shared/powertools';

export const logger = getLogger('lambda/send-slack-alerts');

import { SNSClient, PublishCommand, PublishCommandInput } from '@aws-sdk/client-sns';
import { getEnvironmentVariable } from '../../shared/utils/utils';
import { S3Event, S3EventRecord } from 'aws-lambda';

const AWS_REGION = 'eu-west-2';
const snsClient = new SNSClient({ region: AWS_REGION });
const topicArn = getEnvironmentVariable('SNS_TOPIC_ARN');

interface ReplicationDetails {
  replicationRuleId?: string;
  destinationBucket?: string;
  s3Operation: string;
  requestTime?: string;
  failureReason?: string;
}

export interface S3ReplicationEventRecord extends S3EventRecord {
  replicationEventData: ReplicationDetails;
}

// Accept any event type
export const handler = async (event: unknown): Promise<void> => {
  try {
    logger.info('Sns topic arn is', { topicArn });
    logger.info('Incoming event', { event });

    // Check if the event is an array of S3 events
    if (
      Array.isArray((event as S3Event).Records) &&
      (event as S3Event).Records.some((record: { eventSource: string }) => record.eventSource === 'aws:s3')
    ) {
      logger.info('S3 event records found');
      for (const record of (event as S3Event).Records) {
        // Process only S3 replication events
        if (record.awsRegion === AWS_REGION && record.eventName && record.eventName.startsWith('Replication:')) {
          const s3ReplicationRecord = record as S3ReplicationEventRecord;

          logger.info('Processing record', { record });

          const bucketName = s3ReplicationRecord.s3.bucket.name;
          const objectKey = s3ReplicationRecord.s3.object.key;
          const replicationFailure = s3ReplicationRecord.replicationEventData.failureReason;
          const s3Operation = s3ReplicationRecord.replicationEventData.s3Operation;

          const description =
            '*S3 Replication Failure*\nBucket: `' +
            `${bucketName}` +
            '`\nObject: `' +
            `${objectKey}` +
            '`\nOperation: `' +
            `${s3Operation}` +
            '`\nError: `' +
            `${replicationFailure}` +
            '`';

          logger.info('Slack message description', { description });
          const message = {
            version: '1.0',
            source: 'custom',
            content: {
              textType: 'client-markdown',
              description: description,
            },
          };

          const params: PublishCommandInput = {
            Message: JSON.stringify(message),
            TopicArn: topicArn,
          };

          const command = new PublishCommand(params);

          logger.info('Attempting to send');
          await snsClient.send(command);

          logger.info('Successfully sent S3 replication event to SNS', { message });
        }
      }
    } else {
      logger.info('Received a non-S3 event. Skipping processing.');
    }
  } catch (error) {
    logger.error('Error processing event', { error });
    throw new Error('Error processing event');
  }
};
