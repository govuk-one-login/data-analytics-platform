import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, sqsClient } from '../../shared/clients';
import { createGunzip } from 'zlib';
import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../../shared/powertools';

export const logger = getLogger('lambda/cross-account-transfer');

interface EventConfig {
  event_name: string;
  start_date: string;
  end_date: string;
}

export interface Event {
  config: EventConfig[];
  raw_bucket: string;
  queue_url: string;
}

export const handler = async (event: Event): Promise<{ statusCode: number; body: string }> => {
  try {
    for (const eventConfig of event.config) {
      const eventName = eventConfig.event_name;
      const startDate = eventConfig.start_date;
      const endDate = eventConfig.end_date;
      const dateRange = generateDateRange(startDate, endDate);

      for (const date of dateRange) {
        const s3Bucket = event.raw_bucket;
        const s3Prefix = `txma/${eventName}/year=${date.slice(0, 4)}/month=${date.slice(5, 7)}/day=${date.slice(8, 10)}`;
        const s3Params = { Bucket: s3Bucket, Prefix: s3Prefix };

        const contents = await s3Client.send(new ListObjectsV2Command(s3Params)).then(response => response.Contents);

        if (contents !== undefined && contents.length > 0) {
          const messages = [];
          for (const obj of contents) {
            const getObjectParams = { Bucket: s3Bucket, Key: obj.Key };
            const objectResponse = await s3Client.send(new GetObjectCommand(getObjectParams));
            const objectContent = await getDecompressedContent(objectResponse);
            const jsonEvents = objectContent.trim().split('\n');

            for (const event of jsonEvents) {
              messages.push({
                Id: uuidv4(),
                MessageBody: event,
                MessageAttributes: {
                  date: { DataType: 'String', StringValue: date },
                  bucket: { DataType: 'String', StringValue: s3Bucket },
                  key: { DataType: 'String', StringValue: obj.Key },
                },
              });
            }
          }

          const batchSize = 10;
          const batches = [];
          for (let i = 0; i < messages.length; i += batchSize) {
            batches.push(messages.slice(i, i + batchSize));
          }

          for (const batch of batches) {
            const params = { Entries: batch, QueueUrl: event.queue_url };
            await sqsClient.send(new SendMessageBatchCommand(params));
          }
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify('Messages sent to SQS successfully!') };
  } catch (error) {
    logger.error(`Error calling cross account data transfer lambda`, { error });
    return { statusCode: 500, body: JSON.stringify('Error sending messages to SQS') };
  }
};

async function getDecompressedContent(objectResponse: { Body: NodeJS.ReadableStream }): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const decompressor = createGunzip();
    objectResponse.Body.pipe(decompressor);

    decompressor.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk);
    });
    decompressor.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    decompressor.on('error', (error: Error) => {
      reject(error);
    });
  });
}

function generateDateRange(startDate: string, endDate: string): string[] {
  const dateRange: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    dateRange.push(currentDate.toISOString().slice(0, 10));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateRange;
}
