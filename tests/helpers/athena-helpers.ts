import { TestSupportEvent } from "../../src/handlers/test-support/handler";
import { invokeTestSupportLambda } from "./lambda-helpers";


export const athenaRunQuery = async (QueryString: string): Promise<Record<string, unknown>> => {
    const event: Omit<TestSupportEvent, 'environment'> = {
      command: 'ATHENA_RUN_QUERY',
      input: {
        QueryString: QueryString,
        QueryExecutionContext: {
          Database: process.env.ATHENA_DB// "test-txma-stage"
        },
        WorkGroup:process.env.ATHENA_WORK_GROUP //"test-dap-txma-processing"
      },
    };
  
    return await invokeTestSupportLambda(event);
  };