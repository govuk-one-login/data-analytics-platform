import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { FirehoseClient, PutRecordCommand } from '@aws-sdk/client-firehose';
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry';
import { AWS_CLIENT_BASE_CONFIG } from '../../shared/constants';

const firehoseClient = new FirehoseClient({
  ...AWS_CLIENT_BASE_CONFIG,
  retryStrategy: new ConfiguredRetryStrategy(3, retryAttempt => Math.pow(2, retryAttempt) * 1000),
});

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];
  await Promise.all(
    event.Records.map(async record => {
      try {
        const buffer = getBodyAsBuffer(record);
        const firehoseRequest = getFirehoseCommand(buffer);
        await sendMessageToKinesisFirehose(firehoseRequest);
      } catch (e) {
        console.error(`Error in TxMA Event Consumer for record with body "${record.body}"`, e);
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );
  return { batchItemFailures };
};

const sendMessageToKinesisFirehose = async (firehoseRequest: PutRecordCommand): Promise<void> => {
  try {
    await firehoseClient.send(firehoseRequest);
  } catch (error) {
    console.error("Error delivering data to DAP's Kinesis Firehose:", error);
    throw error;
  }
};

const getBodyAsBuffer = (record: SQSRecord): Uint8Array => {
  try {
    return Buffer.from(record.body);
  } catch (error) {
    console.error('Unable to parse event body into Buffer', error);
    throw error;
  }
};

const getFirehoseCommand = (body: Uint8Array): PutRecordCommand => {
  const deliveryStreamName = process.env.FIREHOSE_STREAM_NAME;
  if (deliveryStreamName === undefined || deliveryStreamName.length === 0) {
    throw new Error('FIREHOSE_STREAM_NAME is not defined in this environment');
  }
  return new PutRecordCommand({
    DeliveryStreamName: deliveryStreamName,
    Record: {
      Data: body,
    },
  });
};
