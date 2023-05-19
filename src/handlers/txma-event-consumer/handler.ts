import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { FirehoseClient, PutRecordCommand } from '@aws-sdk/client-firehose';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const firehoseClient = new FirehoseClient({ region: 'eu-west-2' });
const sqsClient = new SQSClient({ region: 'eu-west-2' });
const DLQ_MAX_RETRY_ATTEMPTS = 3;

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];
  await Promise.all(
    event.Records.map(async record => {
      try {
        const buffer = getBodyAsBuffer(record);
        const firehoseRequest = getFirehoseCommand(buffer);
        await sendMessageToKinesisFirehose(buffer, firehoseRequest);
      } catch (e) {
        console.error(`Error in TxMA Event Consumer for record with body "${record.body}"`, e);
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );
  return { batchItemFailures };
};

const sendMessageToKinesisFirehose = async (
  originalMessage: Uint8Array,
  firehoseRequest: PutRecordCommand
): Promise<void> => {
  let retryAttempts = 0;
  let success = false;
  while (retryAttempts < DLQ_MAX_RETRY_ATTEMPTS) {
    try {
      await firehoseClient.send(firehoseRequest);
      success = true;
      break;
    } catch (e) {
      console.error(`Error delivering data to DAP’s Kinesis Firehose (Attempt ${retryAttempts + 1}):`, e);
      retryAttempts++;
    }
  }
  if (!success) {
    console.error(
      `Exceeded maximum retry attempts for delivering data to DAP’s Kinesis Firehose. Sending message to Dead Letter Queue.`
    );
    await sendToDeadLetterQueue(originalMessage);
  }
};

const sendToDeadLetterQueue = async (originalMessage: Uint8Array): Promise<void> => {
  const queueURL = process.env.queueURL;
  try {
    if (queueURL === undefined || queueURL.length === 0) {
      throw new Error('DEAD_LETTER_QUEUE_NAME is not defined in this environment');
    }
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueURL,
        MessageBody: JSON.stringify(originalMessage),
      })
    );
  } catch (error) {
    console.error(`Error sending message to Dead Letter Queue "${queueURL ?? ''}":`, error);
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
