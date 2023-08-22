import type { Datum, GetQueryResultsOutput, Row } from '@aws-sdk/client-athena';
import type { TestSupportEvent } from '../../src/handlers/test-support/handler';
import { invokeTestSupportLambda } from './lambda-helpers';
import type { GetStatementResultCommandOutput } from '@aws-sdk/client-redshift-data';

export const athenaRunQuery = async (
  QueryString: string,
  database: string,
  workGroup: string,
): Promise<GetQueryResultsOutput> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'ATHENA_RUN_QUERY',
    input: {
      QueryString,
      QueryExecutionContext: {
        Database: database,
      },
      WorkGroup: workGroup,
    },
  };

  return await invokeTestSupportLambda(event);
};

export const redshiftRunQuery = async (QueryString: string): Promise<GetStatementResultCommandOutput> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'REDSHIFT_RUN_QUERY',
    input: {
      Sql: QueryString,
    },
  };

  return await invokeTestSupportLambda(event);
};

export const redshiftGetRow = async (QueryString: string): Promise<Row> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'REDSHIFT_RUN_QUERY',
    input: {
      Sql: QueryString,
    },
  };

  return await invokeTestSupportLambda(event);
};

export const getQueryResults = async <TResponse>(
  query: string,
  database: string,
  workGroup: string,
): Promise<TResponse[]> => {
  const queryResults = await athenaRunQuery(query, database, workGroup);
  if (queryResults?.ResultSet?.Rows?.[0]?.Data === undefined) throw new Error('Invalid query results');
  const columns = queryResults.ResultSet.Rows[0].Data;
  const rows = queryResults.ResultSet.Rows.slice(1).map(d => d.Data);
  return rows
    .filter((val: Datum[] | undefined): val is Datum[] => val !== undefined)
    .map(row =>
      row.reduce((acc, _, index) => {
        const fieldName = columns[index].VarCharValue;
        const fieldValue = row[index].VarCharValue;
        return fieldName === undefined || fieldValue === undefined
          ? acc
          : {
              ...acc,
              [fieldName]: fieldValue,
            };
      }, {}),
    ) as TResponse[];
};
