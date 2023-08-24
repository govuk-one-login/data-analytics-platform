import * as fs from 'fs';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import { TodayDate, getEventFilePrefix, productFamily, waitForStepFunction } from '../helpers/common-helpers';
import { checkFileCreatedOnS3, copyFilesFromBucket } from '../helpers/s3-helpers';
import { startStepFunction, stepFunctionListExecutions } from '../helpers/step-helpers';
import {
  rawdataS3BucketName,
  redshiftProcessStepFucntionName,
  stageProcessStepFucntionName,
  txmaProcessingWorkGroupName,
  txmaStageDatabaseName,
} from '../helpers/envHelper';
import { faker } from '@faker-js/faker';
import { publishToTxmaQueue } from '../helpers/lambda-helpers';

const data = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));
const organization = new Map<string, string>();

describe('Verify End to End Process from SQS → Raw Layer → Stage Layer → Conformed Layer ', () => {
  // ******************** Copy files to s3 raw bucket ************************************

  test('Events from SQS to Raw Layer is processed, Step Functions Executed, verify Events in fact_user_journey_event table using the Event_id', async () => {
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
        const fileUploaded = await checkFileCreatedOnS3(prefix, event.event_id, 120000);
        expect(fileUploaded).toEqual(true);
      }
    }

    await copyFilesFromBucket(rawdataS3BucketName(), data);

    // ******************** Start raw to stage step function  ************************************
    const stepexecutionId = await startStepFunction(stageProcessStepFucntionName());

    // ******************** wait for  dap-raw-to-stage-process step function to complete ************************************
    const rawToStageStatus = await waitForStepFunction(String(stepexecutionId.executionArn), 30);
    expect(rawToStageStatus).toEqual('SUCCEEDED');

    // ******************** Run Athena queries ************************************
    for (let index = 0; index <= data.length - 1; index++) {
      const productFamilyGroupName = productFamily(data[index]);
      console.log("Prdocut Family Name  "+productFamilyGroupName)
      console.log("Event id is   "+String(organization.get(data[index])))
      const athenaQueryResults = await getQueryResults(
        'SELECT * FROM ' +
          productFamilyGroupName +
          " where event_id = '" +
          String(organization.get(data[index])) +
          "' and processed_date = '" +
          String(TodayDate()) +
          "' ;",
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );

      expect(JSON.stringify(athenaQueryResults)).toContain(String(organization.get(data[index])));
    }
    // ******************** Start raw to stage step function  ************************************
    const RedshiftstepexecutionId = await stepFunctionListExecutions(redshiftProcessStepFucntionName());

    // ******************** wait for  dap-raw-to-stage-process step function to complete ************************************

    const stageToConformedStatus = await waitForStepFunction(String(RedshiftstepexecutionId.executions), 20);

    expect(stageToConformedStatus).toEqual('SUCCEEDED');
    // // ******************** Run Redshift queries ************************************
    for (let index = 0; index <= data.length - 1; index++) {

      console.log("Event id is   "+String(organization.get(data[index])))
      const redShiftQueryResults = await redshiftRunQuery(
        "select * from dap_txma_reporting_db.conformed.fact_user_journey_event where event_id ='" +
          String(organization.get(data[index])) +
          "' and processed_date = " +
          String(TodayDate()),
      );
      expect(redShiftQueryResults.TotalNumRows).not.toEqual(0);
    }
  }, 3600000);
});
