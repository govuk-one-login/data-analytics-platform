import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { AWS_CLIENT_BASE_CONFIG } from '../src/shared/constants';
import type { TestSupportEnvironment, TestSupportEvent } from '../src/handlers/test-support/handler';
import { decodeObject, encodeObject } from '../src/shared/utils/utils';

const lambdaClient = new LambdaClient(AWS_CLIENT_BASE_CONFIG);

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
    return { status: response.StatusCode, payload: decodeObject(response.Payload) };
  } catch (error) {
    console.error(`Error invoking test support lambda with event ${JSON.stringify(event)}`, error);
    throw error;
  }
};
