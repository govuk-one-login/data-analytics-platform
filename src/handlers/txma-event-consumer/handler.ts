import type { Context, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { buildErrorMetadata, getEnvironmentVariable } from '../../shared/utils/utils';
import { logger, initialiseLogger } from '../../shared/logger';
import { ERROR_CODES } from '../../shared/error-codes';
import { AuditEvent, validateAuditEvent } from '../../../common/types/event';
import { parseJson } from '../../shared/objects/parse-json';
import { getBodyAsBuffer } from '../../shared/objects/get-string-as-buffer';
import { firehosePutRecordBatch } from '../../shared/firehose/put-batch-record';

export { logger } from '../../shared/logger';

export const handler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
  initialiseLogger(context);
  const startTime = Date.now();
  const correlationId = context.awsRequestId;
  logger.info('TxMA event consumer handler started', { correlationId, recordCount: event.Records.length });

  const failedRecords = await processRecords(event.Records, correlationId);

  logger.info('TxMA event consumer handler completed', {
    correlationId,
    outcome: failedRecords.length === 0 ? 'success' : 'partial',
    duration: Date.now() - startTime,
    recordCount: event.Records.length,
    failedCount: failedRecords.length,
  });

  return {
    batchItemFailures: failedRecords.map(record => ({ itemIdentifier: record.messageId })),
  };
};

const processRecords = async (records: SQSRecord[], correlationId: string): Promise<SQSRecord[]> => {
  const { validRecords, failedRecords } = validateRecords(records, correlationId);
  if (validRecords.length === 0) return failedRecords;
  try {
    const streamName = getEnvironmentVariable('FIREHOSE_STREAM_NAME');
    await sendToFirehose(validRecords, streamName);
    return failedRecords;
  } catch (error) {
    const streamName = process.env.FIREHOSE_STREAM_NAME ?? 'UNKNOWN';
    logger.error("Error delivering batch data to DAP's Kinesis Firehose", {
      correlationId,
      streamName,
      error: buildErrorMetadata(error, ERROR_CODES.FIREHOSE_DELIVERY_FAILED),
    });
    return [...failedRecords, ...validRecords];
  }
};

const validateRecords = (records: SQSRecord[], correlationId: string) => {
  return records.reduce(
    (acc, record) => {
      try {
        const auditEvent = parseJson(record.body) as AuditEvent;
        const errors = validateAuditEvent(auditEvent);

        if (errors.length > 0) {
          const validationError = new Error(`Invalid audit event: ${errors.join(', ')}`);
          validationError.name = 'AuditEventValidationError';
          logger.error('Invalid audit event', {
            correlationId: record.messageId,
            eventId: auditEvent.event_id ?? 'UNKNOWN',
            componentId: auditEvent.component_id ?? 'UNKNOWN',
            errors: [...errors],
            error: buildErrorMetadata(validationError, ERROR_CODES.INVALID_AUDIT_EVENT),
          });
          acc.failedRecords.push(record);
        } else {
          acc.validRecords.push(record);
        }
      } catch (error) {
        logger.error('Error processing record', {
          correlationId: record.messageId,
          messageId: record.messageId,
          error: buildErrorMetadata(error, ERROR_CODES.RECORD_PROCESSING_FAILED),
        });
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
