import { poll } from '../helpers/common-helpers';
import type { TestSupportEvent } from '../../src/handlers/test-support/handler';
import { invokeTestSupportLambda } from './lambda-helpers';

interface S3ListEntry {
  Key: string;
  LastModified: string;
  ETag: string;
  Size: number;
  StorageClass: string;
}

async function checkFileUploaded(contents: S3ListEntry[], eventId: string): Promise<boolean> {
  for (const val of contents) {
    const fileData = await getS3DataFileContent(val.Key);
    const body = fileData.body as string;
    const fileContent = body.split('\n');
    const parsedContent = fileContent.map(line => JSON.parse(line));
    const event = parsedContent.filter(line => line.event_id === eventId);
    if (event.length > 0) {
      return true;
    }
  }
  return false;
}

async function checkKinesisForErrorCode(contents: S3ListEntry[], errorCode: string): Promise<boolean> {
  for (const val of contents) {
    const fileData = await getS3DataFileContent(val.Key);
    const body = fileData.body as string;
    const fileContent = body.split('\n');
    const filtered = fileContent.filter(function (el) {
      return el !== '';
    });
    const parsedContent = filtered.map(line => JSON.parse(line));
    const event = parsedContent.filter(line => line.errorCode === errorCode);
    if (event.length > 0) {
      return true;
    }
  }
  return false;
}

export const getS3DataFileContent = async (key: string | undefined): Promise<Record<string, unknown>> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'S3_GET',
    input: {
      Bucket: process.env.TXMA_BUCKET,
      Key: key,
    },
  };

  return await invokeTestSupportLambda(event);
};

export const getEventListS3 = async (prefix: string): Promise<Record<string, unknown>> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'S3_LIST',
    input: {
      Bucket: process.env.TXMA_BUCKET,
      Prefix: prefix,
    },
  };
  return await invokeTestSupportLambda(event);
};

export const checkFileCreatedOnS3 = async (prefix: string, eventID: string, timeoutMs: number): Promise<boolean> => {
  const pollS3BucketForEventIdString = async (): Promise<boolean> => {
    const contents = await getEventListS3(prefix).then(result => result.Contents as S3ListEntry[]);
    if (contents !== undefined) {
      if (contents.length > 0) {
        contents.sort((f1, f2) => Date.parse(f2.LastModified) - Date.parse(f1.LastModified));
        return await checkFileUploaded(contents, eventID);
      }
    }
    return false;
  };
  return await poll(pollS3BucketForEventIdString, result => result, {
    timeout: timeoutMs,
    nonCompleteErrorMessage: 'File never got to S3 within the timeout',
  });
};

export const checkFileCreatedOnS3kinesis = async (
  prefix: string,
  errorCode: string,
  timeoutMs: number,
): Promise<boolean> => {
  const pollS3BucketForEventIdString = async (): Promise<boolean> => {
    const contents = await getEventListS3(prefix).then(result => result.Contents as S3ListEntry[]);
    if (contents !== undefined) {
      if (contents.length > 0) {
        contents.sort((f1, f2) => Date.parse(f2.LastModified) - Date.parse(f1.LastModified));
        return await checkKinesisForErrorCode(contents, errorCode);
      }
    }
    return false;
  };
  return await poll(pollS3BucketForEventIdString, result => result, {
    timeout: timeoutMs,
    nonCompleteErrorMessage: 'File never got to S3 within the timeout',
  });
};

// function uploadFile(file: { path: any; filename: any; }, bucketName: any) {
//   const S3 = require("aws-sdk/clients/s3");

// const fs = require("fs");

//   const fileStream = fs.createReadStream(file.path);

//   const uploadParams = {

//     Bucket: bucketName,

//     Body: fileStream,

//     Key: file.filename,

//   };

// return S3.upload(uploadParams).promise(); // this will upload file to S3

// }

