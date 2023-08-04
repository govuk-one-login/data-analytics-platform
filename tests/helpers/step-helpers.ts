import { TestSupportEvent } from "../../src/handlers/test-support/handler";
import { invokeTestSupportLambda } from "./lambda-helpers";


export const executeStepFunction = async (functionName: string,stateMachineArn : string): Promise<Record<string, unknown>> => {
    const event: Omit<TestSupportEvent, 'environment'> = {
      command: functionName,
      input: {
           stateMachineArn: stateMachineArn,
    },
    return await invokeTestSupportLambda(event);
  };
