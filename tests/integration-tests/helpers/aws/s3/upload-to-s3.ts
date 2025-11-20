import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { rawdataS3BucketName } from '../../../../helpers/envHelper';
import { gzip } from 'zlib';
import { promisify } from 'util';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });
const gzipAsync = promisify(gzip);

export const uploadEventToRawLayer = async (event: Record<string, unknown>): Promise<void> => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const key = `txma-refactored/year=${year}/month=${month}/day=${day}/${event.event_id}.json.gz`;
  const compressed = await gzipAsync(JSON.stringify(event));

  await s3Client.send(
    new PutObjectCommand({
      Bucket: rawdataS3BucketName(),
      Key: key,
      Body: compressed,
      ContentType: 'application/gzip',
      ContentEncoding: 'gzip',
    }),
  );
};

export const deleteEventFromRawLayer = async (eventId: string): Promise<void> => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const key = `txma-refactored/year=${year}/month=${month}/day=${day}/${eventId}.json.gz`;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: rawdataS3BucketName(),
      Key: key,
    }),
  );
};
