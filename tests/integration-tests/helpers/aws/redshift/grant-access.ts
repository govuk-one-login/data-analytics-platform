/* eslint-disable no-console */
import { RedshiftDataClient, ExecuteStatementCommand, DescribeStatementCommand } from '@aws-sdk/client-redshift-data';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

const redshiftClient = new RedshiftDataClient({});
const stsClient = new STSClient({});

let permissionsGranted = false;

export async function grantRedshiftAccess(workgroupName: string): Promise<void> {
  // Skip if already granted in this test run
  if (permissionsGranted) {
    return;
  }

  const database = 'dap_txma_reporting_db_refactored';
  const identity = await stsClient.send(new GetCallerIdentityCommand({}));

  // For Redshift Serverless with IAM federation, use the full assumed-role name
  // ARN format: arn:aws:sts::account:assumed-role/AWSReservedSSO_ApprovedAdmin_.../username
  const arnParts = identity.Arn?.split('/');
  const roleName = arnParts?.[1]; // Full role name with session ID

  const username = `IAMR:${roleName}`;

  // Run a simple query first to ensure the federated user is created in Redshift
  const initQuery = await redshiftClient.send(
    new ExecuteStatementCommand({
      WorkgroupName: workgroupName,
      Database: database,
      Sql: 'SELECT 1;',
    }),
  );

  let initStatus = 'SUBMITTED';
  while (initStatus === 'SUBMITTED' || initStatus === 'PICKED' || initStatus === 'STARTED') {
    await new Promise(resolve => setTimeout(resolve, 500));
    const statusResult = await redshiftClient.send(new DescribeStatementCommand({ Id: initQuery.Id! }));
    initStatus = statusResult.Status!;
  }

  const secretArn = process.env.REDSHIFT_SECRET_ARN;
  if (!secretArn) {
    throw new Error(
      'REDSHIFT_SECRET_ARN environment variable is required. ' +
        'Set it to the ARN of the Secrets Manager secret containing Redshift admin credentials.',
    );
  }

  const grants = [
    `GRANT USAGE ON SCHEMA conformed_refactored TO "${username}";`,
    `GRANT SELECT ON ALL TABLES IN SCHEMA conformed_refactored TO "${username}";`,
  ];

  for (const grant of grants) {
    const result = await redshiftClient.send(
      new ExecuteStatementCommand({
        WorkgroupName: workgroupName,
        Database: database,
        Sql: grant,
        SecretArn: secretArn,
      }),
    );

    const statementId = result.Id!;
    let status = 'SUBMITTED';
    while (status === 'SUBMITTED' || status === 'PICKED' || status === 'STARTED') {
      await new Promise(resolve => setTimeout(resolve, 500));
      const statusResult = await redshiftClient.send(new DescribeStatementCommand({ Id: statementId }));
      status = statusResult.Status!;

      if (status === 'FAILED') {
        const error = statusResult.Error || 'Unknown error';
        console.error(`Grant failed. Status: ${status}, Error: ${error}`);
        console.error(`Attempted grant: ${grant}`);
        console.error(`Workgroup: ${workgroupName}, Database: ${database}`);
        console.error('\nYour IAM role does not have permission to grant on this schema.');
        console.error('An admin needs to run: GRANT conformed_refactored TO "' + username + '" WITH ADMIN OPTION;');
        throw new Error(`Query failed with status: ${status}. Error: ${error}`);
      }
    }
  }

  permissionsGranted = true;
}
