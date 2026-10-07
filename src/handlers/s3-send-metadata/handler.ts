import { logger, initialiseLogger } from '../../shared/logger';
import { buildErrorMetadata, getEnvironmentVariable, getS3EventRecords } from '../../shared/utils/utils';
import { ERROR_CODES } from '../../shared/error-codes';
import type { Context, S3Event, S3EventRecord } from 'aws-lambda';
import { sqsClient } from '../../shared/clients';
import type { SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import * as path from 'node:path';
import type { RedshiftFileMetadata } from '../../shared/types/redshift-metadata';

interface MessageParams {
  filePath: string;
  filePathGroupId: string;
  messageBody: string;
}

export const handler = async (event: S3Event, context: Context): Promise<void> => {
  initialiseLogger(context);
  const startTime = Date.now();
  const correlationId = context.awsRequestId;
  logger.info('Handler started', { correlationId });

  try {
    const queueUrl = getEnvironmentVariable('METADATA_QUEUE_URL');
    const records = getS3EventRecords(event);
    logger.info('Sending redshift metadata to SQS', { correlationId, queueUrl, recordCount: records.length });
    await Promise.all(
      records.map(async record => {
        const messageParams = getMessageParams(record);
        logger.info('Sending metadata to SQS', {
          correlationId,
          filePath: messageParams.filePath,
          filePathGroupId: messageParams.filePathGroupId,
        });
        await sendToSQS(queueUrl, messageParams);
      }),
    );
    logger.info('Handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
      recordCount: records.length,
    });
  } catch (error) {
    logger.error('Error sending S3 metadata', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.SEND_METADATA_FAILED),
    });
    throw error;
  }
};

const getMessageParams = (record: S3EventRecord): MessageParams => {
  const bucket = record.s3.bucket.name;
  const key = record.s3.object.key;
  const filename = path.parse(key).name;
  const groupIdMatchArray = /(.+)_\d{4}.+/.exec(filename);
  if (groupIdMatchArray === null) {
    throw new Error(`Unable to parse key path string "${filename}"`);
  }
  const filePathGroupId = groupIdMatchArray[1]!;
  const fileMetadata: RedshiftFileMetadata = { bucket, file_path: key };
  return {
    filePath: filename,
    filePathGroupId,
    messageBody: JSON.stringify(fileMetadata),
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
