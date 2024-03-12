import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { PutRecordCommand } from '@aws-sdk/client-firehose';
import { firehoseClient } from '../../shared/clients';
import { getAWSEnvironment, getEnvironmentVariable } from '../../shared/utils/utils';
import { getLoggerAndMetrics } from '../../shared/powertools';
import { MetricUnit } from '@aws-lambda-powertools/metrics';

export const { logger, metrics } = getLoggerAndMetrics('lambda/txma-event-consumer');

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];
  const shouldLog = shouldLogEvents();

  await Promise.all(
    event.Records.map(async record => {
      if (shouldLog) {
        logger.info(`Received record with message id ${record.messageId} with event ${JSON.stringify(record.body)}`);
      }

      try {
        const buffer = getBodyAsBuffer(record);
        const firehoseRequest = getFirehoseCommand(buffer);
        await sendMessageToKinesisFirehose(firehoseRequest);
      } catch (e) {
        logger.error(`Error in TxMA Event Consumer for record with body "${JSON.stringify(record.body)}"`, { e });
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }),
  );
  addMetrics(event.Records, batchItemFailures);
  return { batchItemFailures };
};

const sendMessageToKinesisFirehose = async (firehoseRequest: PutRecordCommand): Promise<void> => {
  try {
    await firehoseClient.send(firehoseRequest);
  } catch (error) {
    logger.error("Error delivering data to DAP's Kinesis Firehose:", { error });
    throw error;
  }
};

const getBodyAsBuffer = (record: SQSRecord): Uint8Array => {
  try {
    return Buffer.from(record.body);
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

const shouldLogEvents = (): boolean => {
  try {
    const environment = getAWSEnvironment();
    return environment === 'dev' || environment === 'test';
  } catch (e) {
    return false;
  }
};

const addMetrics = (records: SQSRecord[], batchItemFailures: SQSBatchItemFailure[]): void => {
  const total = records.length;
  const failures = batchItemFailures.length;
  const successes = total - failures;
  metrics.addMetric('event-total', MetricUnit.Count, total);
  metrics.addMetric('event-success', MetricUnit.Count, successes);
  metrics.addMetric('event-failure', MetricUnit.Count, failures);
  metrics.addMetric('event-success-percentage', MetricUnit.Percent, (100 * successes) / total);
  metrics.addMetric('event-failure-percentage', MetricUnit.Percent, (100 * failures) / total);
  metrics.publishStoredMetrics();
};
