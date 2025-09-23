import { InvokeCommand } from '@aws-sdk/client-lambda';
import type { ListEventSourceMappingsResponse } from '@aws-sdk/client-lambda';
import type { TestSupportEvent } from '../../src/handlers/test-support/handler';
import { decodeObject, encodeObject, getAWSEnvironment } from '../../common/utilities/utils';
import { lambdaClient } from '../../common/clients';
import { getLogger } from '../../common/powertools';
const logger = getLogger('auth_account_creation_group');

export interface GetQueueUrlResult {
  QueueUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const publishToTxmaQueue = async (payload: any): Promise<unknown> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'SQS_SEND',
    input: {
      QueueUrl: process.env.TXMA_QUEUE_URL,
      MessageBody: typeof payload === 'string' ? payload : JSON.stringify(payload),
    },
  };

  return await invokeTestSupportLambda(event);
};

export const getSQSQueueUrl = async (queneName: string): Promise<GetQueueUrlResult> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'SQS_GET_URL',
    input: {
      QueueName: queneName,
    },
  };
  return await invokeTestSupportLambda(event);
};

export const listLambdaEventMappings = async (functionName?: string): Promise<ListEventSourceMappingsResponse> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'LAMBDA_LIST_EVENTS',
    input: {
      FunctionName: functionName ?? 'txma-event-consumer',
    },
  };
  return await invokeTestSupportLambda(event);
};

export const invokeTestSupportLambda = async (
  event: Omit<TestSupportEvent, 'environment'>,
): Promise<Record<string, unknown>> => {
  const environment = getAWSEnvironment();

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
      }),
    );
    if (response.StatusCode !== 200 && response.Payload === undefined) {
      throw new Error(`TestSupportEvent Lambda Call failed with response ${JSON.stringify(response)}`);
    }
    return decodeObject(response.Payload);
  } catch (error) {
    logger.error(`Error invoking test support lambda with event ${JSON.stringify(event)}`, { error });
    throw error;
  }
};
