import { TodayDate } from '../helpers/common-helpers';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import {
  deliveryStreamName,
  rawdataS3BucketName,
  redshiftProcessStepFucntionName,
  stageProcessStepFucntionName,
  txmaProcessingWorkGroupName,
  txmaStageDatabaseName,
} from '../helpers/envHelper';
import { describeFirehoseDeliveryStream } from '../helpers/firehose-helpers';
import { listLambdaEventMappings } from '../helpers/lambda-helpers';
import { getS3BucketStatus } from '../helpers/s3-helpers';
import { startStepFunction } from '../helpers/step-helpers';

describe('smoke tests for DAP services', () => {
  // 	    // ******************** Smoke Tests  ************************************

  test.skip('Verify Lambda is connected to SQS ', async () => {
    const lambdaEvents = await listLambdaEventMappings();
    expect(lambdaEvents.EventSourceMappings).toHaveLength(1);

    const txmaEvent = lambdaEvents.EventSourceMappings?.at(0);
    expect(txmaEvent).toBeDefined();
    // todo uncomment lines below when txma queues are correctly setup in staging, integration and production
    // expect(txmaEvent?.EventSourceArn).toEqual(expect.stringContaining(`self-${envName()}-EC-SQS-Output-Queue-dataAnalyticsPlatform`));
    // expect(txmaEvent?.State).toEqual('Enabled');
  });

  test.skip('Verify Data Firehose is reachable ', async () => {
    const deliveryStream = await describeFirehoseDeliveryStream(deliveryStreamName());
    expect(deliveryStream.DeliveryStreamDescription?.DeliveryStreamStatus === 'ACTIVE');
  });

  test.skip('Verify s3 Buckets are reachable ', async () => {
    const filesins3 = await getS3BucketStatus(rawdataS3BucketName(), 'txma');
    expect(filesins3.$metadata.httpStatusCode === 200);
  });

  test.skip('Verify Athena queries are executable ', async () => {
    const athenaQueryResults = await getQueryResults(
      'SELECT * from txma_stage_layer_key_values limit 10',
      txmaStageDatabaseName(),
      txmaProcessingWorkGroupName(),
    );
    expect(JSON.stringify(athenaQueryResults)).not.toBeNull();
  });

  test.skip('Verify latest day data has been processed ', async () => {
    const athenaQueryResults = await getQueryResults(
      'SELECT * from txma_stage_layer_key_values where processed_dt = ' + TodayDate() + ' limit 10',
      txmaStageDatabaseName(),
      txmaProcessingWorkGroupName(),
    );
    expect(JSON.stringify(athenaQueryResults)).not.toBeNull();
  });

  test.skip('Verify Redshift Database is reachable ', async () => {
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
});
