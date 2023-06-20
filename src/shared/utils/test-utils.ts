import type { SQSEvent } from 'aws-lambda';
import { readFile } from 'fs/promises';
import type { Readable } from 'stream';
import type { SdkStream } from '@aws-sdk/types';

export const mockSQSEvent = (...bodies: unknown[]): SQSEvent => {
  return {
    Records: bodies.map((body, index) => ({
      body,
      messageId: (index + 1).toString(),
    })),
  } as unknown as SQSEvent;
};

export const getTestResource = async (filename: string, encoding: BufferEncoding = 'utf-8'): Promise<string> => {
  return await readFile(`src/test-resources/${filename}`, { encoding });
};

interface BodyStreamParams {
  stringValue?: unknown;
  byteValue?: unknown;
}

type BodyStream = SdkStream<Readable | ReadableStream | Blob>;

export const mockS3BodyStream = ({ stringValue, byteValue }: BodyStreamParams): BodyStream => {
  const mockBodyStream: unknown = {
    transformToString: async () => stringValue,
    transformToByteArray: async () => byteValue,
  };
  return mockBodyStream as BodyStream;
};
