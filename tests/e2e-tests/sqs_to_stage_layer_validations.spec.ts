import * as fs from 'fs';
import { faker } from "@faker-js/faker";
import { athenaRunQuery, getQueryResults } from "../helpers/athena-helpers";
import { getEventFilePrefix } from "../helpers/common-helpers";
import { publishToTxmaQueue } from "../helpers/lambda-helpers";
import { checkFileCreatedOnS3, copyFilesFromBucket } from "../helpers/s3-helpers";
import { describeExecution, startStepFunction} from '../helpers/step-helpers';

let eventList : string[] = []

describe("Verify Data from raw layer is processed to stage layer", () => {
// 	    // ******************** Copy files to s3 raw bucket ************************************


    test("store files in s3 bucket in raw layer and process step function and validate using Athena queries ", async () => {
        test.concurrent.each`
        eventName                                      | event_id               | client_id              | journey_id
        ${'AUTH_CHECK_USER_NO_ACCOUNT_WITH_EMAIL'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
        ${'AUTH_CREATE_ACCOUNT'}                       | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
         `(
        'Should validate $eventName event content stored on S3',
         async ({ ...data }) => {
          // given
          const event = JSON.parse(fs.readFileSync('tests/fixtures/txma-event-auth-account-creation-group.json', 'utf-8'));
          event.event_id = data.event_id;
          event.client_id = data.client_id;
          event.user.govuk_signin_journey_id = data.journey_id;
          event.event_name = data.eventName;
          eventList.push(event.event_name)
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
          const fileUploaded = await checkFileCreatedOnS3(prefix, event.event_id, 120000);
          expect(fileUploaded).toEqual(true);
        },
        240000,
         )
        for (let i = 0; i < eventList.length; i++) {
            console.log(eventList[i]);
            }

         copyFilesFromBucket(String(process.env.TXMA_BUCKET),eventList,10000)

// 	    // ******************** Start raw to stage step function  ************************************
        const stepexecutionId = await startStepFunction('test-dap-raw-to-stage-process')

//         // ******************** wait for  dap-raw-to-stage-process step function to complete ************************************         

    let StepExecutionStatus = await describeExecution(String(stepexecutionId.executionArn))
	let timer =1 
	while( timer <= 18) { 
		if ((StepExecutionStatus.status == ('SUCCEEDED'))){
			console.log('execution status Succeeded')
			break;
		}timer++
        await setTimeout(() => { console.log("waiting for stepfunction to complete"); }, 60000);
		StepExecutionStatus = await describeExecution(String(stepexecutionId.executionArn))
	 } 
	expect(StepExecutionStatus.status).toEqual('SUCCEEDED');


		// // ******************** Run Athena queries ************************************  
	const athenaQueryResults = await getQueryResults("SELECT event_id from auth_account_creation where event_name = 'AUTH_CREATE_ACCOUNT' and processed_date = '20230724'");
	console.log(athenaQueryResults)
    expect(JSON.stringify(athenaQueryResults)).not;
})
})