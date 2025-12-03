import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getIntegrationTestEnv } from '../../utils/utils';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });

const getTodaysPrefix = (basePath: string): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${basePath}/year=${year}/month=${month}/day=${day}/`;
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
  return deleteS3Objects(getIntegrationTestEnv('RAW_LAYER_BUCKET'), getTodaysPrefix('txma-refactored'));
};
