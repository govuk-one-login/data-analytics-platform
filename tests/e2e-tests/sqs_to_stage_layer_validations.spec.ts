import * as fs from 'fs';
import { getQueryResults } from '../helpers/db-helpers';
import { delay, getEventFilePrefix, productFamily, yesterdayDate } from '../helpers/common-helpers';
import { checkFileCreatedOnS3, copyFilesFromBucket } from '../helpers/s3-helpers';
import { describeExecution, startStepFunction } from '../helpers/step-helpers';
import {
  rawdataS3BucketName,
  stageProcessStepFucntionName,
  txmaProcessingWorkGroupName,
  txmaStageDatabaseName,
} from '../helpers/envHelper';
import { faker } from '@faker-js/faker';
import { publishToTxmaQueue } from '../helpers/lambda-helpers';

const data = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));
const organization = new Map<string, string>();

describe('Verify Data from raw layer is processed to stage layer', () => {
  // ******************** Copy files to s3 raw bucket ************************************

  test('store files in s3 bucket in raw layer and process step function and validate using Athena queries ', async () => {
    for (let index = 0; index <= data.length - 1; index++) {
      const productFamilyGroup = productFamily(data[index]).replaceAll('_', '-');
      const event = JSON.parse(
        fs.readFileSync('tests/fixtures/txma-event-' + productFamilyGroup + '-group.json', 'utf-8'),
      );
      event.event_id = faker.string.uuid();
      event.client_id = faker.string.uuid();
      event.user.govuk_signin_journey_id = faker.string.uuid();
      event.event_name = data[index];
      organization.set(event.event_name, event.event_id);
      const pastDate = faker.date.past();
      event.timestamp = Math.round(pastDate.getTime() / 1000);
      event.timestamp_formatted = JSON.stringify(pastDate);
      // when
      const publishResult = await publishToTxmaQueue(event);
      // then
      expect(publishResult).not.toBeNull();
      expect(publishResult).toHaveProperty('MessageId');

      // given
      const prefix = getEventFilePrefix(event.event_name);

      // then
      if (index === data.length - 1) {
        const fileUploaded = await checkFileCreatedOnS3(prefix, event.event_id, 60000);
        expect(fileUploaded).toEqual(true);
      }
    }
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
      const productFamilyGroupName = productFamily(data[index]).replaceAll('_', '-');
      const athenaQueryResults = await getQueryResults(
        "SELECT '" +
          String(organization.get(data[index])) +
          "' As row_count from auth_account_creation where event_name = '" +
          productFamilyGroupName +
          "' and processed_date = '" +
          String(yesterdayDate()) +
          "'",
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      expect(JSON.stringify(athenaQueryResults)).not.toContain('row_count: "0"');
    }
  }, 2400000);
});
