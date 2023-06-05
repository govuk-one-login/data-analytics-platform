import {InvokeCommand} from '@aws-sdk/client-lambda';
import type {TestSupportEnvironment, TestSupportEvent} from '../../src/handlers/test-support/handler';
import {decodeObject, encodeObject} from '../../src/shared/utils/utils';
import {s3Client} from '../../src/shared/clients';


export const publishToTxmaQueue = async (payload: string): Promise<unknown> => {
  const event = {
    command: 'SQS_SEND',
    input: {
      QueueUrl: process.env.TXMA_QUEUE_URL,
      MessageBody: payload
    }
  }

  return invokeTestSupportLambda(event);
};

export const getTxmaDataFile = async (key: string): Promise<unknown> => {
  const event = {
    command: 'S3_GET',
    input: {
      Bucket: process.env.TXMA_BUCKET,
      Key: key
    }
  }

  return invokeTestSupportLambda(event);
};

export const invokeTestSupportLambda = async (event: Omit<TestSupportEvent, 'environment'>): Promise<unknown> => {
  const environment = process.env.AWS_ENVIRONMENT as TestSupportEnvironment;

  const payload: TestSupportEvent = {
    environment,
    ...event,
  };

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
      throw new Error('TestSupportEvent Lambda Call failed with status code ' +response.StatusCode);
    }
    return decodeObject(response.Payload);
  } catch (error) {
    console.error(`Error invoking test support lambda with event ${JSON.stringify(event)}`, error);
    throw error;
  }
};
