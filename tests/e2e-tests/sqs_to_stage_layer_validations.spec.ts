import { DescribeExecutionCommand } from "@aws-sdk/client-sfn";
import { getEventFilePrefixDayBefore, getTodayDateTime } from "../helpers/common-helpers";



const AthenaExpress = require("athena-express"),
	AWS = require("aws-sdk"),
	awsCredentials = {
		region: "eu-west-2"
	};

AWS.config.update(awsCredentials);
const AWS1 = require('aws-sdk');

//AthenaExpress config object
const athenaExpressConfig = {
	aws: AWS, // required 
	s3: "test-dap-stage-layer", // optional 
	db: "test-txma-stage", // optional
	workgroup: "test-dap-txma-processing", // optional
	formatJson: true, // optional
	retry: 200, // optional
	getStats: true, // optional
	ignoreEmpty: true, // optional
	skipResults: false, // optional
	waitForResults: false, // optional
	catalog: "hive" //optional
};
const s3 = new AWS.S3();
const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");
const client = new SFNClient();



describe("Verify Data from raw layer is processed to stage layer", () => {
	    // ******************** Copy files to s3 raw bucket ************************************


    test("store files in s3 bucket in raw layer and process step function and validate using Athena queries ", async () => {


		const params = {
			Bucket: 'test-auto-raw-data'
		};
		
		const data = await s3.listObjects(params).promise(30000);
		
		for (let index = 0; index < data['Contents'].length; index++) {
			const filename = data['Contents'][index]['Key']
			if (filename.includes('.gz')) {
			const Bucket_Name = 'test-dap-raw-layer/'+ getEventFilePrefixDayBefore(filename.split('/')[0]);
			const Source = 'test-auto-raw-data/'+ filename;
			const Key = filename.split('/')[1]
					const input = {
			"Bucket": Bucket_Name,
			"CopySource": Source,
			"Key": Key
		  };
		  await s3.copyObject(input).promise(30000);
			} 
		}
		

	    // ******************** Start raw to stage step function  ************************************
		console.log('starting step execution')
			const DateTime = getTodayDateTime()
			console.log(DateTime)
			let StepFunctionExecutionName = 'execution'+DateTime
			console.log(await invoke(StepFunctionExecutionName,
				'arn:aws:states:eu-west-2:072886614474:stateMachine:test-dap-raw-to-stage-process',
				{fistName: 'test'},1000000));
		

        // ******************** wait for  raw to stage step function to complete ************************************         
	console.log('execution start ')
	const StepFuntionArn = 'arn:aws:states:eu-west-2:072886614474:execution:test-dap-raw-to-stage-process:'+StepFunctionExecutionName
	const input1 = { 
		executionArn: StepFuntionArn // required
		}
	let StepExecutionStatus = null;
	// const timeoutId = setTimeout(function callbackFunction() {}, delayMs)
	let timer =1 
	while( timer >=18) { 
		if ((StepExecutionStatus != ('Succeeded').toLowerCase)){
			console.log('execution status Succeeded')
			break;
		}timer++
		
		const command = new DescribeExecutionCommand(input1);
		const response = await client.send(command);
		StepExecutionStatus = (response.status).toLowerCase
	 } 


	// const command = new DescribeExecutionCommand(input1);
	// const response = await client.send(command);
	// console.log('execution end ')
	// console.log(response.status)
	expect((StepExecutionStatus).toEqual(('Succeeded').toLowerCase));


		// // ******************** Run Athena queries ************************************  
     const athenaExpress = new AthenaExpress(athenaExpressConfig);
    let query = {
    sql: "SELECT * from auth_account_creation"
    };
    let p1 = athenaExpress.query(query);
    let result = null;
    result = await p1;
    const myQueryExecutionId = result.QueryExecutionId;
    let results = await athenaExpress.query(myQueryExecutionId);
    expect(results.Count).not.toBeNull();


	})
});

export async function invoke(executionName: string, arn: string, input: { fistName: string; },timeoutMs: number) {
    const command = new StartExecutionCommand({
        input: JSON.stringify(input),
        name: executionName,
        stateMachineArn: arn,
     timeout: timeoutMs,
    });
    
    return await client.send(command);
}
    




