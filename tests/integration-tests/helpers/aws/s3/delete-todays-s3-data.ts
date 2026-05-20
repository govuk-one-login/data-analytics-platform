import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getIntegrationTestEnv } from '../../utils/utils';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });

const getRecentPrefixes = (basePath: string, daysBack = 7): string[] => {
  const prefixes: string[] = [];
  for (let i = 0; i <= daysBack; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    prefixes.push(`${basePath}/year=${year}/month=${month}/day=${day}/`);
  }
  return prefixes;
};

const deleteS3Objects = async (bucketName: string, prefix: string): Promise<number> => {
  const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix });
  const result = await s3Client.send(listCommand);

  if (!result.Contents?.length) return 0;

  for (const object of result.Contents) {
    if (object.Key) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: object.Key }));
    }
  }
  return result.Contents.length;
};

export const deleteRawLayerTodaysData = async (): Promise<number> => {
  const bucket = getIntegrationTestEnv('RAW_LAYER_BUCKET');
  const prefixes = getRecentPrefixes('txma-refactored');
  let totalDeleted = 0;
  for (const prefix of prefixes) {
    totalDeleted += await deleteS3Objects(bucket, prefix);
  }
  return totalDeleted;
};
