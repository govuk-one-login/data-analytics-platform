import * as fs from 'fs';
import { faker } from "@faker-js/faker";
import { athenaRunQuery } from "../helpers/athena-helpers";
import { getEventFilePrefix } from "../helpers/common-helpers";
import { publishToTxmaQueue } from "../helpers/lambda-helpers";
import { checkFileCreatedOnS3, copyFilesFromBucket } from "../helpers/s3-helpers";
import { startStepFunction} from '../helpers/step-helpers';

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

         copyFilesFromBucket('test-dap-raw-layer',eventList,10000)

// 	    // ******************** Start raw to stage step function  ************************************
        startStepFunction('test-dap-raw-to-stage-process')

// 		console.log('starting step execution')

// 			const DateTime = getTodayDateTime()
// 			console.log(DateTime)
// 			let StepFunctionExecutionName = 'execution'+DateTime
// 			console.log(await invoke(StepFunctionExecutionName,
// 				'arn:aws:states:eu-west-2:072886614474:stateMachine:test-dap-raw-to-stage-process',
// 				{fistName: 'test'},1000000));
		

//         // ******************** wait for  raw to stage step function to complete ************************************         
// 	console.log('execution start ')
// 	const StepFuntionArn = 'arn:aws:states:eu-west-2:072886614474:execution:test-dap-raw-to-stage-process:'+StepFunctionExecutionName
// 	const input1 = { 
// 		executionArn: StepFuntionArn // required
// 		}
	let StepExecutionStatus = null;
// 	// const timeoutId = setTimeout(function callbackFunction() {}, delayMs)
	let timer =1 
	while( timer >=18) { 
        
		if ((StepExecutionStatus != ('Succeeded').toLowerCase)){
			console.log('execution status Succeeded')
			break;
		}timer++
		const response = describeExecution('test-dap-raw-to-stage-process')
		StepExecutionStatus = (response.status).toLowerCase
	 } 


// 	// const command = new DescribeExecutionCommand(input1);
// 	// const response = await client.send(command);
// 	// console.log('execution end ')
// 	// console.log(response.status)
// 	expect((StepExecutionStatus).toEqual(('Succeeded').toLowerCase));


		// // ******************** Run Athena queries ************************************  

	const athenaparams = JSON.parse(fs.readFileSync('sam-local-examples/test-support/athena-run-query.json', 'utf-8'));
	// console.log(athenaparams)
	athenaparams.env = 'test',
	athenaparams.input.QueryExecutionContext = {Database:'test-txma-stage'},
	athenaparams.input.WorkGroup = 'test-dap-txma-processing'
	athenaparams.input.QueryString = "SELECT * from auth_account_creation"
	const athenaQueryResults = athenaRunQuery("SELECT * from auth_account_creation");
	console.log(athenaQueryResults)


	
    //  const athenaExpress = new AthenaExpress(athenaExpressConfig);
    // let query = {
    // sql: "SELECT * from auth_account_creation"
    // };
    // let p1 = athenaExpress.query(query);
    // let result = null;
    // result = await p1;
    // const myQueryExecutionId = result.QueryExecutionId;
    // let results = await athenaExpress.query(myQueryExecutionId);
    // expect(results.Count).not.toBeNull();

})
})
