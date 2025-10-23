import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  Row,
} from '@aws-sdk/client-athena';
import { getIntegrationTestEnv } from '../../utils/utils';

export async function executeAthenaQuery(query: string, database: string): Promise<Row[]> {
  const client = new AthenaClient({});

  const startCommand = new StartQueryExecutionCommand({
    QueryString: query,
    QueryExecutionContext: { Database: database },
    WorkGroup: getIntegrationTestEnv('ATHENA_WORKGROUP'),
  });

  const startResult = await client.send(startCommand);
  const executionId = startResult.QueryExecutionId!;

  // Wait for query to complete
  let status = 'RUNNING';
  while (status === 'RUNNING' || status === 'QUEUED') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusCommand = new GetQueryExecutionCommand({ QueryExecutionId: executionId });
    const statusResult = await client.send(statusCommand);
    status = statusResult.QueryExecution?.Status?.State || 'FAILED';
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Query failed with status: ${status}`);
  }

  // Get results
  const resultsCommand = new GetQueryResultsCommand({ QueryExecutionId: executionId });
  const resultsResponse = await client.send(resultsCommand);

  return resultsResponse.ResultSet?.Rows || [];
}
