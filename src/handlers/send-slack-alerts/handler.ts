import { getLogger } from '../../shared/powertools';

const logger = getLogger('lambda/send-slack-alerts');

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({ region: 'eu-west-2' });
const topicArn = 'YOUR_SNS_TOPIC_ARN';

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
    // Check if the event is an array of S3 events
    if (
      Array.isArray(event.Records) &&
      event.Records.some((record: { eventSource: string }) => record.eventSource === 'aws:s3')
    ) {
      for (const record of event.Records) {
        // Process only S3 replication events
        if (
          record.awsRegion === 'eu-west-2' && // Replace with your replication region
          record.eventName &&
          record.eventName.startsWith('ObjectReplication:')
        ) {
          //const s3ReplicationRecord = record as S3EventRecord; // Type assertion for clarity

          const bucketName = record.s3.bucket.name;
          const objectKey = record.s3.object.key;
          const replicationStatus = record.s3.replication.status;
          const errorMessage = record.s3.replication.replicationFailureDetails?.message || 'N/A';

          const message = JSON.stringify({
            bucketName,
            objectKey,
            replicationStatus,
            errorMessage,
          });

          const params = {
            Message: message,
            TopicArn: topicArn,
          };

          const command = new PublishCommand(params);

          await snsClient.send(command);

          logger.debug(`Successfully sent S3 replication event to SNS: ${message}`);
        }
      }
    } else {
      logger.debug('Received a non-S3 event. Skipping processing.');
    }
  } catch (error) {
    logger.error('Error processing event:', { error });
  }
};
