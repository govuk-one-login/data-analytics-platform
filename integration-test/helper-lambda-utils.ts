import {InvokeCommand, LambdaClient} from '@aws-sdk/client-lambda';
import {AWS_CLIENT_BASE_CONFIG} from '../src/shared/constants';
import type {TestSupportEnvironment, TestSupportEvent} from '../src/handlers/test-support/handler';
import {decodeObject, encodeObject} from '../src/shared/utils/utils';

const lambdaClient = new LambdaClient(AWS_CLIENT_BASE_CONFIG);

export const publishToTxma = async (payload: string): Promise<unknown> => {
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
    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: `test-support-${environment}`,
        Payload: encodeObject(payload),
        LogType: 'Tail',
        InvocationType: 'RequestResponse',
      })
    );
    if (response.StatusCode !== 200 && response.Payload === undefined) {
      throw new Error('Lambda Call is unsuccessful');
    }
    return decodeObject(response.Payload);
  } catch (error) {
    console.error(`Error invoking test support lambda with event ${JSON.stringify(event)}`, error);
    throw error;
  }
};
