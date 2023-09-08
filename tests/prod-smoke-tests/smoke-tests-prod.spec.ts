import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';

import { FACT_TABLE_EVENT_PROCESSED_TODAY, PROCESSED_EVENT_BY_NAME } from '../helpers/query-constant';
import { TodayDate } from '../helpers/common-helpers';
import fs from 'fs';
import { listLambdaEventMappings } from '../helpers/lambda-helpers';
import { describeFirehoseDeliveryStream } from '../helpers/firehose-helpers';
import {
  deliveryStreamName,
  rawdataS3BucketName,
  redshiftProcessStepFucntionName,
  stageProcessStepFucntionName,
  txmaProcessingWorkGroupName,
  txmaStageDatabaseName,
} from '../helpers/envHelper';
import { getS3BucketStatus } from '../helpers/s3-helpers';
import { startStepFunction } from '../helpers/step-helpers';

describe('smoke tests for DAP services prod', () => {
  // 	    // ******************** Smoke Tests  ************************************
  test('Verify Lambda is connected to SQS in prod', async () => {
    const lambdaEvents = await listLambdaEventMappings();
    expect(lambdaEvents.EventSourceMappings).toHaveLength(1);

    const txmaEvent = lambdaEvents.EventSourceMappings?.at(0);
    expect(txmaEvent).toBeDefined();
    // todo uncomment lines below when txma queues are correctly setup in staging, integration and production
    // expect(txmaEvent?.EventSourceArn).toEqual(expect.stringContaining(`self-${envName()}-EC-SQS-Output-Queue-dataAnalyticsPlatform`));
    // expect(txmaEvent?.State).toEqual('Enabled');
  });

  test('Verify Data Firehose is reachable in prod', async () => {
    const deliveryStream = await describeFirehoseDeliveryStream(deliveryStreamName());
    expect(deliveryStream.DeliveryStreamDescription?.DeliveryStreamStatus === 'ACTIVE');
  });

  test('Verify s3 Buckets are reachable in prod', async () => {
    const filesins3 = await getS3BucketStatus(rawdataS3BucketName(), 'txma');
    expect(filesins3.$metadata.httpStatusCode === 200);
  });

  test('Verify Athena queries are executable in prod', async () => {
    const athenaQueryResults = await getQueryResults(
      'SELECT * from auth_account_creation limit 10',
      txmaStageDatabaseName(),
      txmaProcessingWorkGroupName(),
    );
    expect(JSON.stringify(athenaQueryResults)).not.toBeNull();
  });

  test.skip('Verify Redshift Database is reachable in prod', async () => {
    const redShiftQueryResults = await redshiftRunQuery(
      'select event_key from dap_txma_reporting_db.conformed.dim_event',
    );
    expect(JSON.stringify(redShiftQueryResults)).not.toBeNull();
  });
  test.skip('Verify dap-raw-to-stage-process StepFunction is returning success', async () => {
    const stepexecutionId = await startStepFunction(stageProcessStepFucntionName());
    expect(stepexecutionId).not.toBeNull();
  });
  test.skip('Verify dap-redshift-processing StepFunction is returning success', async () => {
    const stepexecutionId = await startStepFunction(redshiftProcessStepFucntionName());
    expect(stepexecutionId).not.toBeNull();
  });

  test('Verify that records are processed today in prod', async () => {
    const query = FACT_TABLE_EVENT_PROCESSED_TODAY + String(TodayDate());
    const redShiftQueryResults = await redshiftRunQuery(query);
    // console.log('Data:' + JSON.stringify(redShiftQueryResults));
    expect(redShiftQueryResults).not.toBeNull();
    expect(redShiftQueryResults.TotalNumRows).toBeGreaterThan(1);
  });

  test('Output the number of records processed for specific event type on todays date in prod', async () => {
    const data = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));
    const countData = {};
    for (let index = 0; index <= data.length - 1; index++) {
      const query =
        PROCESSED_EVENT_BY_NAME + "'" + (data[index] as string) + "' and processed_date=" + String(TodayDate());
      const redShiftQueryResults = await redshiftRunQuery(query);
      expect(redShiftQueryResults).not.toBeNull();
      countData[data[index]] = redShiftQueryResults.TotalNumRows;
    }
    // console.log('countData:' + JSON.stringify(countData));
  }, 24000000);
});
