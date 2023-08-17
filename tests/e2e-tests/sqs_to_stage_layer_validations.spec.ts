import * as fs from 'fs';
import { getQueryResults } from '../helpers/db-helpers';
import { delay, yesterdayDate } from '../helpers/common-helpers';
import { copyFilesFromBucket } from '../helpers/s3-helpers';
import { describeExecution, startStepFunction } from '../helpers/step-helpers';
import {
  rawdataS3BucketName,
  stageProcessStepFucntionName,
  txmaProcessingWorkGroupName,
  txmaStageDatabaseName,
} from '../helpers/envHelper';

const data = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));

describe('Verify Data from raw layer is processed to stage layer', () => {
  // ******************** Copy files to s3 raw bucket ************************************

  test('store files in s3 bucket in raw layer and process step function and validate using Athena queries ', async () => {
    await copyFilesFromBucket(rawdataS3BucketName(), data);

    // ******************** Start raw to stage step function  ************************************
    const stepexecutionId = await startStepFunction(stageProcessStepFucntionName());

    // ******************** wait for  dap-raw-to-stage-process step function to complete ************************************

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

    // ******************** Run Athena queries ************************************
    for (let index = 0; index <= data.length - 1; index++) {
      const athenaQueryResults = await getQueryResults(
        "SELECT count(*) As row_count from auth_account_creation where event_name = '" +
          String(data[index]) +
          "' and processed_date = '" +
          yesterdayDate() +
          "'",
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      expect(JSON.stringify(athenaQueryResults)).not.toContain('row_count: "0"');
    }
  }, 2400000);
});
