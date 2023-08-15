import * as fs from 'fs';
import { faker } from "@faker-js/faker";
import { athenaRunQuery, getQueryResults } from "../helpers/athena-helpers";
import { delay, getEventFilePrefix } from "../helpers/common-helpers";
import { publishToTxmaQueue } from "../helpers/lambda-helpers";
import { checkFileCreatedOnS3, copyFilesFromBucket } from "../helpers/s3-helpers";
import { describeExecution, startStepFunction} from '../helpers/step-helpers';


const  data = JSON.parse(fs.readFileSync('tests/e2e-tests/data/eventList.json', 'utf-8'))


describe("Verify Data from raw layer is processed to stage layer", () => {
// 	    // ******************** Copy files to s3 raw bucket ************************************


    test("store files in s3 bucket in raw layer and process step function and validate using Athena queries ", async () => {

         await copyFilesFromBucket(String(process.env.TXMA_BUCKET),data,10000)

// 	    // ******************** Start raw to stage step function  ************************************
        const stepexecutionId = await startStepFunction('test-dap-raw-to-stage-process')

// //         // ******************** wait for  dap-raw-to-stage-process step function to complete ************************************         
    await delay(10000);
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


// 		// // ******************** Run Athena queries ************************************  
// 	const athenaQueryResults = await getQueryResults("SELECT event_id from auth_account_creation where event_name = 'AUTH_CREATE_ACCOUNT' and processed_date = '20230724'");
// 	console.log(athenaQueryResults)
//     expect(JSON.stringify(athenaQueryResults)).not;
},240000,)
})