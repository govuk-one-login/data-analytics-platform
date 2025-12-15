/* eslint-disable no-console */
import {
  RedshiftDataClient,
  ExecuteStatementCommand,
  DescribeStatementCommand,
  GetStatementResultCommand,
} from '@aws-sdk/client-redshift-data';
// import { getIntegrationTestEnv } from '../../utils/utils';

export const executeRedshiftQuery = async (query: string, database: string): Promise<string[]> => {
  const client = new RedshiftDataClient({});

  const executeCommand = new ExecuteStatementCommand({
    Sql: query,
    WorkgroupName: 'build-redshift-serverless-workgroup',
    Database: database,
  });

  const executeResult = await client.send(executeCommand);
  const statementId = executeResult.Id!;

  let status = 'SUBMITTED';
  while (status === 'SUBMITTED' || status === 'PICKED' || status === 'STARTED') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const describeCommand = new DescribeStatementCommand({ Id: statementId });
    const describeResult = await client.send(describeCommand);
    status = describeResult.Status || 'FAILED';

    if (describeResult.Error) {
      console.log('RedShift Error:', describeResult.Error);
    }
  }

  if (status !== 'FINISHED') {
    throw new Error(`Query failed with status: ${status}`);
  }

  const resultsCommand = new GetStatementResultCommand({ Id: statementId });
  const resultsResponse = await client.send(resultsCommand);

  return (resultsResponse.Records?.map(record => record[0]?.stringValue).filter(Boolean) as string[]) || [];
};
