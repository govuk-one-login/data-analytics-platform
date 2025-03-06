import { logger } from './handler';
import type { TestSupportEvent } from './handler';
import { GetQueryExecutionCommand, GetQueryResultsCommand, StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import type { GetQueryResultsOutput } from '@aws-sdk/client-athena';
import { getEnvironmentVariable, getRequiredParams, sleep } from '../../shared/utils/utils';
import { athenaClient, redshiftDataClient } from '../../shared/clients';
import {
  DescribeStatementCommand,
  ExecuteStatementCommand,
  GetStatementResultCommand,
} from '@aws-sdk/client-redshift-data';
import type { GetStatementResultCommandOutput } from '@aws-sdk/client-redshift-data';

export type QueryRunnerDatabaseType = 'athena' | 'redshift';

interface QueryStatus {
  status?: string;
  extraInfo?: unknown;
}

export class QueryRunner {
  private readonly databaseType: QueryRunnerDatabaseType;

  constructor(databaseType: QueryRunnerDatabaseType) {
    this.databaseType = databaseType;
  }

  async runQuery(event: TestSupportEvent): Promise<unknown> {
    try {
      const queryId = await this.startQuery(event);
      await this.waitForQueryToSucceed(queryId, event.input.timeoutMs ?? 5000);
      return await this.getQueryResults(queryId);
    } catch (e) {
      logger.error(`Error executing ${this.databaseType} query with input ${JSON.stringify(event.input)}`, { e });
      throw e;
    }
  }

  private async startQuery(event: TestSupportEvent): Promise<string | undefined> {
    if (this.databaseType === 'athena') {
      const request = new StartQueryExecutionCommand({
        ...getRequiredParams(event.input, 'QueryString', 'QueryExecutionContext', 'WorkGroup'),
      });
      return await athenaClient.send(request).then(response => response.QueryExecutionId);
    } else {
      const request = new ExecuteStatementCommand({
        ...getRequiredParams(event.input, 'Sql'),
        Database: `${event.environment}-redshift`,
        WorkgroupName: `${event.environment}-redshift-serverless-workgroup`,
        SecretArn: getEnvironmentVariable('REDSHIFT_SECRET_ARN'),
      });
      return await redshiftDataClient.send(request).then(response => response.Id);
    }
  }

  private async waitForQueryToSucceed(queryId: string | undefined, timeoutMs: number): Promise<void> {
    let status: QueryStatus | undefined;
    let timeRemaining = timeoutMs;
    while (timeRemaining > 0) {
      status = await this.getQueryStatus(queryId);

      // return if SUCCEEDED (FINISHED for redshift) to stop waiting, break if CANCELLED (ABORTED for redshift) to allow error to be thrown
      // don't break if FAILED as athena may retry and put back in QUEUED
      // see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-athena/interfaces/queryexecutionstatus.html#state-5
      // see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-redshift-data/interfaces/describestatementcommandoutput.html#status-1
      if (status?.status === 'SUCCEEDED' || status?.status === 'FINISHED') {
        return;
      } else if (status?.status === 'CANCELLED' || status?.status === 'ABORTED') {
        break;
      }
      timeRemaining -= 200;
      await sleep(200);
    }
    throw new Error(`Query did not complete in ${timeoutMs}ms - final status was ${JSON.stringify(status)}`);
  }

  private async getQueryStatus(queryId: string | undefined): Promise<QueryStatus | undefined> {
    if (this.databaseType === 'athena') {
      return await athenaClient.send(new GetQueryExecutionCommand({ QueryExecutionId: queryId })).then(response => {
        const status = response.QueryExecution?.Status;
        if (status === undefined) {
          return undefined;
        }
        return { status: status.State, extraInfo: { reason: status.StateChangeReason, error: status.AthenaError } };
      });
    } else {
      return await redshiftDataClient
        .send(new DescribeStatementCommand({ Id: queryId }))
        .then(response => ({ status: response.Status, extraInfo: response.Error }));
    }
  }

  private async getQueryResults(
    queryId: string | undefined,
  ): Promise<GetQueryResultsOutput | GetStatementResultCommandOutput> {
    if (this.databaseType === 'athena') {
      return await athenaClient.send(new GetQueryResultsCommand({ QueryExecutionId: queryId }));
    } else {
      return await redshiftDataClient.send(new GetStatementResultCommand({ Id: queryId }));
    }
  }
}
