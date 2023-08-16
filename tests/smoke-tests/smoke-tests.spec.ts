import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import { describeFirehoseDeliveryStream } from '../helpers/firehose-helpers';
import { getSQSQueueUrl } from '../helpers/lambda-helpers';
import { getS3BucketStatus } from '../helpers/s3-helpers';

const sqsQueueName = process.env.ENVIRONMENT+'-placeholder-txma-event-queue';
const deliveryStreamName = process.env.ENVIRONMENT+'-dap-txma-delivery-stream';
const rawdataS3BucketName = process.env.ENVIRONMENT+'-dap-raw-layer';

describe('smoke tests for DAP services', () => {
  // 	    // ******************** Smoke Tests  ************************************

  test('Verify SQS Queue is reachable ', async () => {
    const sqsUrl = await getSQSQueueUrl(sqsQueueName);
    expect(sqsUrl.QueueUrl).toContain(sqsQueueName);
  });

  test('Verify Data Firehose is reachable ', async () => {
    const deliveryStream = await describeFirehoseDeliveryStream(deliveryStreamName);
    expect(deliveryStream.DeliveryStreamDescription?.DeliveryStreamStatus === 'ACTIVE');
  });

  test('Verify s3 Buckets are reachable ', async () => {
    const filesins3 = await getS3BucketStatus(rawdataS3BucketName, 'txma');
    expect(filesins3.$metadata.httpStatusCode === 200);
  });

  test('Verify Athena queries are executable ', async () => {
    const athenaQueryResults = await getQueryResults('SELECT * from auth_account_creation');
    expect(JSON.stringify(athenaQueryResults)).not.toBeNull();
  });

  test('Verify Redshift Database is reachable ', async () => {
    const redShiftQueryResults = await redshiftRunQuery('select event_key from dap_txma_reporting_db.conformed.dim_event');
    expect(JSON.stringify(redShiftQueryResults)).not.toBeNull();
  });
});
