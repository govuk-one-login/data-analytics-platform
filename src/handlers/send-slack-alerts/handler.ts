import { getLogger } from '../../shared/powertools';

const logger = getLogger('lambda/send-slack-alerts');

import { SNSClient, PublishCommand, PublishCommandInput } from '@aws-sdk/client-sns';
import { getEnvironmentVariable } from '../../shared/utils/utils';

const snsClient = new SNSClient({ region: 'eu-west-2' });
const topicArn = getEnvironmentVariable('SNS_TOPIC_ARN');

// interface ReplicationDetails {
//   status: string;
//   replicationFailureDetails?: {
//     message: string;
//   };
// }

// interface S3ReplicationEventRecord extends S3EventRecord {
//   s3: {
//     replication: ReplicationDetails;
//   };
// }
//@ts-expect-error why
export const handler = async (event): Promise<void> => {
  // Accept any event type
  try {
    logger.info('Sns topic arn is', { topicArn });
    logger.info('Incoming event', { event });
    // Check if the event is an array of S3 events
    if (
      Array.isArray(event.Records) &&
      event.Records.some((record: { eventSource: string }) => record.eventSource === 'aws:s3')
    ) {
      logger.info('Records found ');
      for (const record of event.Records) {
        // Process only S3 replication events
        // if (
        //   record.awsRegion === 'eu-west-2' && // Replace with your replication region
        //   record.eventName &&
        //   record.eventName.startsWith('Replication:')
        // ) {
        //const s3ReplicationRecord = record as S3EventRecord; // Type assertion for clarity

        logger.info('Processing record', { record });
        const bucketName = record.s3.bucket.name;
        logger.info('Bucket name', { bucketName });
        const objectKey = record.s3.object.key;
        logger.info('objectKey', { objectKey });
        const replicationFailure = record.replicationEventData.failureReason;
        logger.info('replicationFailure', { replicationFailure });
        const s3Operation = record.replicationEventData.s3Operation;
        logger.info('s3Operation', { s3Operation });
        const description = `*S3 Replication Failure*\nBucket: ${bucketName}\nObject: ${objectKey}\nOperation: ${s3Operation}\nError: ${replicationFailure}`;

        logger.info(description, { description });
        const message = {
          version: '1.0',
          source: 'custom',
          content: {
            textType: 'client-markdown',
            description: description,
          },
        };

        logger.debug('Formed message to send ', { message });
        const params: PublishCommandInput = {
          Message: JSON.stringify(message),
          TopicArn: topicArn,
        };

        const command = new PublishCommand(params);

        logger.debug('Attempting to send');
        await snsClient.send(command);

        logger.debug(`Successfully sent S3 replication event to SNS: ${message}`);
      }
    }
    // } else {
    //   logger.debug('Received a non-S3 event. Skipping processing.');
    // }
  } catch (error) {
    logger.error('Error processing event:', { error });
  }
};
