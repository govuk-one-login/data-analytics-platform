import type { Context, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { getEnvironmentVariable } from '../../shared/utils/utils';
import { getLogger } from '../../shared/powertools';
import { AuditEvent, validateAuditEvent } from '../../../common/types/event';
import { parseJson } from '../../shared/objects/parse-json';
import { getBodyAsBuffer } from '../../shared/objects/get-string-as-buffer';
import { firehosePutRecordBatch } from '../../shared/firehose/put-batch-record';

export const logger = getLogger('lambda/txma-event-consumer');

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
    await sendToFirehose(validRecords);
    return failedRecords;
  } catch (error) {
    logger.error("Error delivering batch data to DAP's Kinesis Firehose:", { error });
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
        logger.error('Error processing record', { error: e });
        acc.failedRecords.push(record);
      }
      return acc;
    },
    { validRecords: [] as SQSRecord[], failedRecords: [] as SQSRecord[] },
  );
};

const sendToFirehose = async (records: SQSRecord[]) => {
  const firehoseRecords = records.map(record => ({
    Data: getBodyAsBuffer(record.body),
  }));
  await firehosePutRecordBatch(getEnvironmentVariable('FIREHOSE_STREAM_NAME'), firehoseRecords);
};
