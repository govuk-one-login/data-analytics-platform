import { getEventFilePrefix, getEventFilePrefixDayBefore, poll } from './common-helpers';
import type { S3CopyCommandResult, TestSupportEvent } from '../../src/handlers/test-support/handler';
import { invokeTestSupportLambda } from './lambda-helpers';
import type { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { rawdataS3BucketName } from './envHelper';

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
      Bucket: rawdataS3BucketName(),
      Key: key,
    },
  };

  return await invokeTestSupportLambda(event);
};

export const cpS3files = async (
  bucket: string,
  key: string,
  CopySource: string,
  DeleteOriginal = false,
): Promise<S3CopyCommandResult> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'S3_COPY',
    input: {
      Bucket: bucket,
      Key: key,
      CopySource,
      DeleteOriginal,
    },
  };

  return await invokeTestSupportLambda(event);
};

export const getEventListS3 = async (prefix: string): Promise<Record<string, unknown>> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'S3_LIST',
    input: {
      Bucket: rawdataS3BucketName(),
      Prefix: prefix,
    },
  };
  return await invokeTestSupportLambda(event);
};

export const getS3BucketStatus = async (bucket: string, prefix: string): Promise<ListObjectsV2CommandOutput> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'S3_LIST',
    input: {
      Bucket: bucket,
      Prefix: prefix,
    },
  };
  return (await invokeTestSupportLambda(event)) as unknown as ListObjectsV2CommandOutput;
};

export const getListS3 = async (bucket: string): Promise<Record<string, unknown>> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'S3_LIST',
    input: {
      Bucket: bucket,
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

export const copyFilesFromBucket = async (BucketName: string, eventList: string[]): Promise<boolean> => {
  for (let index = 0; index < eventList.length; index++) {
    const sourceFilePath = getEventFilePrefix(eventList[index]);
    let fileName: string[] = [];
    let sourceFilename = '';
    const contents = await getEventListS3(sourceFilePath).then(result => result.Contents as S3ListEntry[]);
    if (contents !== undefined) {
      if (contents.length > 0) {
        contents.sort((f1, f2) => Date.parse(f1.LastModified) - Date.parse(f2.LastModified));

        for (let index1 = 0; index1 < contents.length; index1++) {
          sourceFilename = contents[index1].Key;
          fileName = sourceFilename.split('/');

          const destinationFilePath = getEventFilePrefixDayBefore(eventList[index]);
          const key = destinationFilePath + '/' + fileName[fileName.length - 1];
          const copySource = '/' + BucketName + '/' + sourceFilename;
          await cpS3files(BucketName, key, copySource, true);
        }
      }
    }
  }
  return false;
};
