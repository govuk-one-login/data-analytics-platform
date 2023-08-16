import * as fs from 'fs';
import { getQueryResults } from '../helpers/db-helpers';
import { delay } from '../helpers/common-helpers';
import { copyFilesFromBucket } from '../helpers/s3-helpers';
import { describeExecution, startStepFunction } from '../helpers/step-helpers';

const data = JSON.parse(fs.readFileSync('tests/e2e-tests/data/eventList.json', 'utf-8'));

describe('Verify Data from raw layer is processed to stage layer', () => {
  // 	    // ******************** Copy files to s3 raw bucket ************************************

  test('store files in s3 bucket in raw layer and process step function and validate using Athena queries ', async () => {
    await copyFilesFromBucket(process.env.ENVIRONMENT+'-dap-raw-layer', data);

    // // 	    // ******************** Start raw to stage step function  ************************************
    const stepexecutionId = await startStepFunction(process.env.ENVIRONMENT+'-dap-raw-to-stage-process');

    // // //         // ******************** wait for  dap-raw-to-stage-process step function to complete ************************************

    let StepExecutionStatus = await describeExecution(String(stepexecutionId.executionArn));
    let timer = 1;
    while (timer <= 20) {
      if (StepExecutionStatus.status !== 'RUNNING') {
        break;
      }
      timer++;
      await delay(1);
      StepExecutionStatus = await describeExecution(String(stepexecutionId.executionArn));
    }
    expect(StepExecutionStatus.status).toEqual('SUCCEEDED');

    // 		// // ******************** Run Athena queries ************************************
    const athenaQueryResults = await getQueryResults(
      "SELECT count(*) As row_count from auth_account_creation where event_name = 'AUTH_CREATE_ACCOUNT' and processed_date = '20230816'",
    );
    expect(JSON.stringify(athenaQueryResults)).not.toContain('row_count: "0"');
  }, 2400000);
});
