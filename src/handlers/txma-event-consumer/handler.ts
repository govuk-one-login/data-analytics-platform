import type { Context, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { getEnvironmentVariable } from '../../shared/utils/utils';
import { logger } from '../../shared/logger';
import { AuditEvent, validateAuditEvent } from '../../../common/types/event';
import { parseJson } from '../../shared/objects/parse-json';
import { getBodyAsBuffer } from '../../shared/objects/get-string-as-buffer';
import { firehosePutRecordBatch } from '../../shared/firehose/put-batch-record';

export { logger } from '../../shared/logger';

export const handler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
  logger.addContext(context);
  const failedRecords = await processRecords(event.Records);
  return {
    batchItemFailures: failedRecords.map(record => ({ itemIdentifier: record.messageId })),
  };
};

const processRecords = async (records: SQSRecord[]): Promise<SQSRecord[]> => {
  const { validRecords, failedRecords } = validateRecords(records);
  if (validRecords.length === 0) return failedRecords;
  try {
    const streamName = getEnvironmentVariable('FIREHOSE_STREAM_NAME');
    await sendToFirehose(validRecords, streamName);
    return failedRecords;
  } catch (error) {
    const streamName = process.env.FIREHOSE_STREAM_NAME ?? 'UNKNOWN';
    logger.error("Error delivering batch data to DAP's Kinesis Firehose:", { streamName, error });
    return [...failedRecords, ...validRecords];
  }
};

const validateRecords = (records: SQSRecord[]) => {
  return records.reduce(
    (acc, record) => {
      try {
        const auditEvent = parseJson(record.body) as AuditEvent;
        const errors = validateAuditEvent(auditEvent);

        if (errors.length > 0) {
          logger.error('Invalid audit event', {
            eventId: auditEvent.event_id ?? 'UNKNOWN',
            componentId: auditEvent.component_id ?? 'UNKNOWN',
            errors: [...errors],
          });
          acc.failedRecords.push(record);
        } else {
          acc.validRecords.push(record);
        }
      } catch (e) {
        logger.error('Error processing record', { messageId: record.messageId, error: e });
        acc.failedRecords.push(record);
      }
      return acc;
    },
    { validRecords: [] as SQSRecord[], failedRecords: [] as SQSRecord[] },
  );
};

const sendToFirehose = async (records: SQSRecord[], streamName: string) => {
  const firehoseRecords = records.map(record => ({
    Data: getBodyAsBuffer(record.body),
  }));
  await firehosePutRecordBatch(streamName, firehoseRecords);
};
