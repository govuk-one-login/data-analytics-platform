import type { TestSupportEvent } from '../../src/handlers/test-support/handler';
import { invokeTestSupportLambda } from './lambda-helpers';

export const startStepFunction = async (stateMachineName: string): Promise<Record<string, unknown>> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'SFN_START_EXECUTION',
    input: {
      stateMachineName,
    },
  };
  return await invokeTestSupportLambda(event);
};

export const describeExecution = async (executionArn: string): Promise<Record<string, unknown>> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'SFN_DESCRIBE_EXECUTION',
    input: {
      executionArn,
    },
  };
  return await invokeTestSupportLambda(event);
};
