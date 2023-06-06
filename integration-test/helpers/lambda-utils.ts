import { InvokeCommand } from '@aws-sdk/client-lambda';
import type { TestSupportEnvironment, TestSupportEvent } from '../../src/handlers/test-support/handler';
import { decodeObject, encodeObject } from '../../src/shared/utils/utils';
import { s3Client } from '../../src/shared/clients';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const publishToTxmaQueue = async (payload: any): Promise<unknown> => {
  const event = {
    command: 'SQS_SEND',
    input: {
      QueueUrl: process.env.TXMA_QUEUE_URL,
      MessageBody: typeof payload === 'string' ? payload : JSON.stringify(payload),
    },
  };

  return await invokeTestSupportLambda(event);
};

export const getTxmaDataFile = async (key: string): Promise<unknown> => {
  const event = {
    command: 'S3_GET',
    input: {
      Bucket: process.env.TXMA_BUCKET,
      Key: key,
    },
  };

  return await invokeTestSupportLambda(event);
};

export const invokeTestSupportLambda = async (event: Omit<TestSupportEvent, 'environment'>): Promise<unknown> => {
  const environment = process.env.AWS_ENVIRONMENT as TestSupportEnvironment;

  const payload: TestSupportEvent = {
    environment,
    ...event,
  };

  console.log(payload);

  try {
    const response = await s3Client.send(
      new InvokeCommand({
        FunctionName: `test-support-${environment}`,
        Payload: encodeObject(payload),
        LogType: 'Tail',
        InvocationType: 'RequestResponse',
      })
    );
    if (response.StatusCode !== 200 && response.Payload === undefined) {
      throw new Error(`TestSupportEvent Lambda Call failed with response ${JSON.stringify(response)}`);
    }
    return decodeObject(response.Payload);
  } catch (error) {
    console.error(`Error invoking test support lambda with event ${JSON.stringify(event)}`, error);
    throw error;
  }
};
