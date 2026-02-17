/* eslint-disable no-console */
import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  Row,
} from '@aws-sdk/client-athena';
import { getIntegrationTestEnv } from '../../utils/utils';

export const executeAthenaQuery = async (query: string, database: string, maxWaitMs = 20000): Promise<Row[]> => {
  const maxRetries = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executeAthenaQueryWithTimeout(query, database, maxWaitMs);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries && lastError.message.includes('timeout')) {
        const backoffMs = 2000 * attempt;
        console.log(`Athena query timeout on attempt ${attempt}/${maxRetries}, retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError;
};

const executeAthenaQueryWithTimeout = async (query: string, database: string, maxWaitMs: number): Promise<Row[]> => {
  const client = new AthenaClient({});

  const startCommand = new StartQueryExecutionCommand({
    QueryString: query,
    QueryExecutionContext: { Database: database },
    WorkGroup: getIntegrationTestEnv('ATHENA_WORKGROUP'),
  });

  const startResult = await client.send(startCommand);
  const executionId = startResult.QueryExecutionId!;

  // Wait for query to complete with timeout
  const startTime = Date.now();
  let status = 'RUNNING';
  while (status === 'RUNNING' || status === 'QUEUED') {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error(`Athena query timeout after ${maxWaitMs}ms. Query ID: ${executionId}, Status: ${status}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusCommand = new GetQueryExecutionCommand({ QueryExecutionId: executionId });
    const statusResult = await client.send(statusCommand);
    status = statusResult.QueryExecution?.Status?.State || 'FAILED';
    const athenaError = statusResult.QueryExecution?.Status?.AthenaError;
    if (athenaError?.ErrorMessage) {
      console.log('Athena Error Message:', athenaError.ErrorMessage);
    }
    if (athenaError?.ErrorType) {
      console.log('Athena Error Type:', athenaError.ErrorType);
    }
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Query failed with status: ${status}`);
  }

  // Get results
  const resultsCommand = new GetQueryResultsCommand({ QueryExecutionId: executionId });
  const resultsResponse = await client.send(resultsCommand);

  return resultsResponse.ResultSet?.Rows || [];
};
