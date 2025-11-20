import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { rawdataS3BucketName, envName } from '../../../../helpers/envHelper';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });

const getTodaysPrefix = (basePath: string): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${basePath}/year=${year}/month=${month}/day=${day}/`;
};

const s3Operation = async (bucketName: string, prefix: string, deleteFiles = false): Promise<string[] | number> => {
  const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix });
  const result = await s3Client.send(listCommand);

  if (!result.Contents?.length) return deleteFiles ? 0 : [];

  if (deleteFiles) {
    for (const object of result.Contents) {
      if (object.Key) {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: object.Key }));
      }
    }
    return result.Contents.length;
  }

  return result.Contents.map(obj => obj.Key!).filter(Boolean);
};

export const listRawLayerTodaysData = async (): Promise<string[]> => {
  return (await s3Operation(rawdataS3BucketName(), getTodaysPrefix('txma-refactored'))) as string[];
};

export const deleteRawLayerTodaysData = async (): Promise<number> => {
  const env = envName();
  if (env !== 'dev' && env !== 'build') {
    throw new Error(`Data deletion not allowed in environment: ${env}`);
  }
  return (await s3Operation(rawdataS3BucketName(), getTodaysPrefix('txma-refactored'), true)) as number;
};
