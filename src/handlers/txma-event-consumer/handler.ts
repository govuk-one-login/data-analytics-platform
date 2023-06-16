import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { PutRecordCommand } from '@aws-sdk/client-firehose';
import { firehoseClient } from '../../shared/clients';
import { getEnvironmentVariable } from '../../shared/utils/utils';

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
  const deliveryStreamName = getEnvironmentVariable('FIREHOSE_STREAM_NAME');
  return new PutRecordCommand({
    DeliveryStreamName: deliveryStreamName,
    Record: {
      Data: body,
    },
  });
};
