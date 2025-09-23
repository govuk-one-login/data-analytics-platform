import type { S3Event, SQSBatchItemFailure, SQSBatchResponse, SQSEvent } from 'aws-lambda';
import type { RedshiftGetMetadataEvent } from '../redshift-get-metadata/handler';
import { getS3EventRecords, getSQSEventRecords } from '../../../common/utilities/utils';
import { getLogger } from '../../../common/powertools';
import { eventbridgeClient } from '../../../common/clients';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import type { PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import type { RedshiftFileMetadata } from '../../../common/types/redshift-metadata';

export const logger = getLogger('lambda/dlq-to-eventbridge');

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
  logger.info('Received event from DLQ', { event });
  const batchItemFailures: SQSBatchItemFailure[] = [];
  const records = getSQSEventRecords(event);
  await Promise.all(
    records.map(async record => {
      try {
        logger.info('Processing record', { record });
        const filePaths = getFilePaths(record.body);
        const messages = filePaths.map(filePath => getEventbridgeMessage(filePath));
        await eventbridgeClient.send(new PutEventsCommand({ Entries: messages }));
      } catch (error) {
        logger.error('Error processing DLQ event', { error });
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
