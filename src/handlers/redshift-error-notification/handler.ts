import { CloudWatchLogsEvent, CloudWatchLogsDecodedData, Context } from 'aws-lambda';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { gunzipSync, InputType } from 'node:zlib';
import { eventbridgeClient } from '../../shared/clients';
import { logger, initialiseLogger } from '../../shared/logger';
import { buildErrorMetadata } from '../../shared/utils/utils';
import { ERROR_CODES } from '../../shared/error-codes';

interface RedshiftErrorDetails {
  Error: string;
  Status: string;
  QueryString: string;
  Database: string;
  WorkgroupName: string;
}

export const handler = async (event: CloudWatchLogsEvent, context?: Context): Promise<void> => {
  if (context !== undefined) {
    initialiseLogger(context);
  }
  const startTime = Date.now();
  const correlationId = context?.awsRequestId;
  logger.info('Handler started', { correlationId });

  try {
    const compressed = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = gunzipSync(compressed as InputType);
    const logData: CloudWatchLogsDecodedData = JSON.parse(decompressed.toString());
    for (const logEvent of logData.logEvents) {
      await processLogEvent(JSON.parse(logEvent.message), correlationId);
    }
    logger.info('Handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Error processing redshift error notification', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.REDSHIFT_ERROR_NOTIFICATION_FAILED),
    });
    throw error;
  }
};

const processLogEvent = async (message: Record<string, unknown>, correlationId: string | undefined): Promise<void> => {
  if (!message.details) return;
  const details = message.details as Record<string, unknown>;
  if (!details.output) return;

  const parsedOutput = JSON.parse(details.output as string);
  const output: RedshiftErrorDetails | undefined = parsedOutput?.sql_output;
  if (output?.Status !== 'FAILED' || !output.Error) return;

  const executionArn = (message.execution_arn as string | undefined) ?? 'N/A';
  const storedProcedureError = new Error(output.Error);
  storedProcedureError.name = 'RedshiftStoredProcedureError';
  logger.error('Redshift stored procedure failure detected', {
    correlationId,
    database: output.Database,
    workgroupName: output.WorkgroupName,
    executionArn,
    error: buildErrorMetadata(storedProcedureError, ERROR_CODES.REDSHIFT_STORED_PROCEDURE_FAILURE),
  });

  const customNotification = {
    version: '1.0',
    source: 'custom',
    content: {
      textType: 'client-markdown',
      title: ':Alert: Redshift Stored Procedure Failure :Alert:',
      description: `*Database:* ${output.Database}\n*Query:* ${output.QueryString}\n\n*Error:* ${output.Error}\n\n*Execution:* \`${executionArn}\``,
    },
  };

  await eventbridgeClient.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: 'dap.redshift.errors',
          DetailType: 'Redshift Error',
          Detail: JSON.stringify({
            notification: customNotification,
            subject: 'DAP Redshift Stored Procedure Failure',
          }),
        },
      ],
    }),
  );
  logger.info('Redshift error notification sent to EventBridge', { correlationId, database: output.Database });
};
