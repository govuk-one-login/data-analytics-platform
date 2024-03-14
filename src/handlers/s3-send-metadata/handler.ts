import { getLogger } from '../../shared/powertools';
import { getEnvironmentVariable, isNullUndefinedOrEmpty } from '../../shared/utils/utils';
import type { S3Event, S3EventRecord } from 'aws-lambda';
import { sqsClient } from '../../shared/clients';
import type { SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import * as path from 'node:path';

const logger = getLogger('lambda/s3-send-metadata');

interface MessageParams {
  filePath: string;
  filePathGroupId: string;
  messageBody: string;
}

export const handler = async (event: S3Event): Promise<void> => {
  try {
    const queueUrl = getEnvironmentVariable('METADATA_QUEUE_URL');
    logger.info('Sending redshift metadata to SQS', { event, queueUrl });

    const records = getRecords(event);
    await Promise.all(
      records.map(async record => {
        const messageParams = getMessageParams(record);
        logger.info('Extracted message params', { messageParams });
        await sendToSQS(queueUrl, messageParams);
      }),
    );
  } catch (error) {
    logger.error('Error sending S3 metadata', { error });
    throw error;
  }
};

const getRecords = (event: S3Event): S3EventRecord[] => {
  if (isNullUndefinedOrEmpty(event?.Records)) {
    const errorMessage = 'Missing event or records';
    logger.error(errorMessage, { event });
    throw new Error(errorMessage);
  }
  return event.Records;
};

const getMessageParams = (record: S3EventRecord): MessageParams => {
  const bucket = record.s3.bucket.name;
  const key = record.s3.object.key;
  const filename = path.parse(key).name;
  const groupIdMatchArray = /(.+)_\d{4}.+/.exec(filename);
  if (groupIdMatchArray === null) {
    throw new Error(`Unable to parse key path string "${filename}"`);
  }
  const filePathGroupId = groupIdMatchArray[1];
  return {
    filePath: filename,
    filePathGroupId,
    messageBody: JSON.stringify({ bucket, file_path: key }),
  };
};

const sendToSQS = async (queueUrl: string, messageParams: MessageParams): Promise<SendMessageCommandOutput> => {
  return await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageGroupId: messageParams.filePathGroupId,
      MessageDeduplicationId: messageParams.filePath,
      MessageBody: messageParams.messageBody,
    }),
  );
};
