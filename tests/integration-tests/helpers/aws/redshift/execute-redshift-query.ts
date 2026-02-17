import {
  RedshiftDataClient,
  ExecuteStatementCommand,
  DescribeStatementCommand,
  GetStatementResultCommand,
} from '@aws-sdk/client-redshift-data';

export const executeRedshiftQuery = async (query: string): Promise<Record<string, string | number>[]> => {
  const client = new RedshiftDataClient({});
  const workgroupName = process.env.REDSHIFT_WORKGROUP_NAME;
  const database = 'dap_txma_reporting_db_refactored';

  if (!workgroupName) {
    throw new Error('REDSHIFT_WORKGROUP_NAME environment variable is required');
  }

  const executeCommand = new ExecuteStatementCommand({
    Sql: query,
    WorkgroupName: workgroupName,
    Database: database,
  });

  const executeResult = await client.send(executeCommand);
  const statementId = executeResult.Id!;

  let status = 'SUBMITTED';
  let errorMessage = '';
  while (status === 'SUBMITTED' || status === 'PICKED' || status === 'STARTED') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const describeCommand = new DescribeStatementCommand({ Id: statementId });
    const describeResult = await client.send(describeCommand);
    status = describeResult.Status || 'FAILED';

    if (describeResult.Error) {
      errorMessage = describeResult.Error;
    }
  }

  if (status !== 'FINISHED') {
    throw new Error(`Query failed with status: ${status}. Error: ${errorMessage}`);
  }

  const resultsCommand = new GetStatementResultCommand({ Id: statementId });
  const resultsResponse = await client.send(resultsCommand);

  const columnMetadata = resultsResponse.ColumnMetadata || [];
  return (resultsResponse.Records || []).map(record => {
    const row: Record<string, string | number> = {};
    record.forEach((field, index) => {
      const columnName = columnMetadata[index]?.name || `column_${index}`;
      row[columnName] = field.stringValue ?? field.longValue ?? '';
    });
    return row;
  });
};
