import type { S3Event, SQSBatchItemFailure, SQSBatchResponse, SQSEvent } from 'aws-lambda';
import type { RedshiftGetMetadataEvent } from '../redshift-get-metadata/handler';
import { getS3EventRecords, getSQSEventRecords } from '../../shared/utils/utils';
import { logger } from '../../shared/logger';
import { eventbridgeClient } from '../../shared/clients';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import type { PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import type { RedshiftFileMetadata } from '../../shared/types/redshift-metadata';

export { logger } from '../../shared/logger';

/**
 * This function receives messages from <code>DeadLetterQueue</code> which means each record body could be any one of
 *
 * <ul>
 *   <li><code>S3Event</code> (input event of s3-raw-to-staging or s3-send-metadata)</li>
 *   <li><code>RedshiftGetMetadataEvent</code> (input event of redshift-get-metadata)</li>
 *   <li><code>RedshiftFileMetadata</code> (the <code>messageBody</code> that s3-send-metadata sends to <code>ReferenceDataSQSQueue</code>, which also uses <code>DeadLetterQueue</code> for its failures)</li>
 * </ul>
 *
 * @param event the SQS event from the DLQ
 *
 * @see S3Event
 * @see RedshiftGetMetadataEvent
 * @see RedshiftFileMetadata
 * @see MessageParams#messageBody
 */
export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];
  const records = getSQSEventRecords(event);
  logger.info('Received event from DLQ', { recordCount: records.length });
  await Promise.all(
    records.map(async record => {
      try {
        logger.info('Processing record', { messageId: record.messageId });
        const filePaths = getFilePaths(record.body);
        const messages = filePaths.map(filePath => getEventbridgeMessage(filePath));
        await eventbridgeClient.send(new PutEventsCommand({ Entries: messages }));
      } catch (error) {
        logger.error('Error processing DLQ event', {
          messageId: record.messageId,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'UnknownError',
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }),
  );
  return { batchItemFailures };
};

const getFilePaths = (body: string): string[] => {
  const object = JSON.parse(body);
  if (isS3Event(object)) {
    const records = getS3EventRecords(object);
    return records.map(record => record.s3.object.key);
  } else if (isRedshiftFileMetadata(object)) {
    return [object.file_path];
  } else if (isRedshiftGetMetadataEvent(object)) {
    const redshiftFileMetadata = JSON.parse(object.fileMetadata);
    return [redshiftFileMetadata.file_path];
  } else {
    throw new Error('Could not parse input event as any of the expected event types');
  }
};

const getEventbridgeMessage = (filePath: string): PutEventsRequestEntry => {
  return {
    Source: 'reference-data-ingestion-pipeline',
    DetailType: 'ingestion-status: failure',
    Detail: JSON.stringify({ filepath: filePath }),
  };
};

const isS3Event = (event: unknown): event is S3Event => {
  return (event as S3Event).Records !== undefined;
};

const isRedshiftFileMetadata = (event: unknown): event is RedshiftFileMetadata => {
  return (
    (event as RedshiftFileMetadata).bucket !== undefined && (event as RedshiftFileMetadata).file_path !== undefined
  );
};

const isRedshiftGetMetadataEvent = (event: unknown): event is RedshiftGetMetadataEvent => {
  return (event as RedshiftGetMetadataEvent).fileMetadata !== undefined;
};
