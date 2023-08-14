import { Datum, GetQueryResultsOutput } from "@aws-sdk/client-athena";
import { TestSupportEvent } from "../../src/handlers/test-support/handler";
import { invokeTestSupportLambda } from "./lambda-helpers";


export const athenaRunQuery = async (QueryString: string): Promise<GetQueryResultsOutput> => {
    const event: Omit<TestSupportEvent, 'environment'> = {
      command: 'ATHENA_RUN_QUERY',
      input: {
        QueryString: QueryString,
        QueryExecutionContext: {
          Database: process.env.ATHENA_DB// "test-txma-stage"
        },
        WorkGroup:process.env.ATHENA_WORK_GROUP //"test-dap-txma-processing"
      },
    };
  
    return await invokeTestSupportLambda(event);
  };

export const redshiftRunQuery = async (QueryString: string): Promise<GetQueryResultsOutput> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'REDSHIFT_RUN_QUERY',
    input: {
      Sql: QueryString,
    },
  };

  return await invokeTestSupportLambda(event);
};

  export const getQueryResults = async <TResponse>(
    query: string
  ): Promise<TResponse[]> => {
    const queryResults = await athenaRunQuery(query)
    if (queryResults?.ResultSet?.Rows?.[0]?.Data === undefined)
      throw new Error("Invalid query results");
    const columns = queryResults.ResultSet.Rows[0].Data;
    const rows = queryResults.ResultSet.Rows.slice(1).map((d) => d.Data);
    return rows
      .filter((val: Datum[] | undefined): val is Datum[] => val !== undefined)
      .map((row) =>
        row.reduce((acc, _, index) => {
          const fieldName = columns[index].VarCharValue;
          const fieldValue = row[index].VarCharValue;
          return fieldName === undefined || fieldValue === undefined
            ? acc
            : {
                ...acc,
                [fieldName]: fieldValue,
              };
        }, {})
      ) as TResponse[];
  };
