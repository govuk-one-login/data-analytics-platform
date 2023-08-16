import { getQueryResults } from "../helpers/athena-helpers";
import { describeFirehoseDeliveryStream } from "../helpers/firehose-helpers";
import { getSQSQueueUrl } from "../helpers/lambda-helpers";
import { getS3BucketStatus } from "../helpers/s3-helpers"


const sqsQueueName = 'test-placeholder-txma-event-queue'
const deiveryStreamName = 'test-dap-txma-delivery-stream'
const rawdataS3BucketName ='test-dap-raw-layer'

describe("smoke tests for DAP services", () => {
    // 	    // ******************** Smoke Tests  ************************************
    
    
        test("Verify SQS Queue is reachable ", async () => {
            const sqsUrl = await getSQSQueueUrl(sqsQueueName)
            expect(sqsUrl.QueueUrl).toContain(sqsQueueName);

        
        })

        test("Verify Data Firehose is reachable ", async () => {
            const deliveryStream = await describeFirehoseDeliveryStream(deiveryStreamName)
            expect(deliveryStream.DeliveryStreamDescription?.DeliveryStreamStatus == 'ACTIVE');

        
        })

        test("Verify s3 Buckets are reachable ", async () => {

            const filesins3 = await getS3BucketStatus(rawdataS3BucketName,'txma')
            expect(filesins3.$metadata.httpStatusCode == 200)
        
        })

        test("Verify Athena queries are executable ", async () => {

            const athenaQueryResults = await getQueryResults("SELECT * from auth_account_creation");
            expect(JSON.stringify(athenaQueryResults)).not.toBeNull;
        
        })

        test("Verify Redshift Databse is reachable ", async () => {
            console.log('Redshift Database WIP')
            
        
        })
    })    