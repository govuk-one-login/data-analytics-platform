import type { Context, SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { PutRecordCommand } from '@aws-sdk/client-firehose';
import { firehoseClient } from '../../shared/clients';
import { getEnvironmentVariable } from '../../shared/utils/utils';
import { getLogger } from '../../shared/powertools';
import { AuditEvent, isValidAuditEvent } from '../../shared/types/event';

export const logger = getLogger('lambda/txma-event-consumer');

export const handler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];
  logger.addContext(context);

  await Promise.all(
    event.Records.map(async record => {
      const processed = await processRecord(record);
      if (!processed) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }),
  );
  return { batchItemFailures };
};

const processRecord = async (record: SQSRecord): Promise<boolean> => {
  try {
    const auditEvent = parseAuditEvent(record.body) as AuditEvent;
    if (!isValidAuditEvent(auditEvent)) {
      logger.error('Invalid audit event', {
        eventId: (auditEvent as AuditEvent).event_id ?? 'UNKNOWN',
        componentId: (auditEvent as AuditEvent).component_id ?? 'UNKNOWN',
      });
      return false;
    }

    const buffer = getBodyAsBuffer(record.body);
    const firehoseRequest = getFirehoseCommand(buffer);
    await sendMessageToKinesisFirehose(firehoseRequest);
    logger.debug('Successfully processed audit event', {
      eventId: auditEvent.event_id,
      componentId: auditEvent.component_id ?? 'UNKNOWN',
    });
    return true;
  } catch (e) {
    logger.error('Error processing record', { error: e });
    return false;
  }
};

const sendMessageToKinesisFirehose = async (firehoseRequest: PutRecordCommand): Promise<void> => {
  try {
    await firehoseClient.send(firehoseRequest);
  } catch (error) {
    logger.error("Error delivering data to DAP's Kinesis Firehose:", { error });
    throw error;
  }
};

const getBodyAsBuffer = (body: string): Uint8Array => {
  try {
    return new Uint8Array(Buffer.from(body));
  } catch (error) {
    logger.error('Unable to parse event body into Buffer', { error });
    throw error;
  }
};

const getFirehoseCommand = (body: Uint8Array): PutRecordCommand => {
  const deliveryStreamName = getEnvironmentVariable('FIREHOSE_STREAM_NAME');
  return new PutRecordCommand({
    DeliveryStreamName: deliveryStreamName,
    Record: {
      Data: body,
    },
  });
};

const parseAuditEvent = (body: string): unknown => {
  return JSON.parse(body);
};
