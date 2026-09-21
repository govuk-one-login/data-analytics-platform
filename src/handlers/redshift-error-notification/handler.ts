import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { gunzipSync, InputType } from 'node:zlib';
import { eventbridgeClient } from '../../shared/clients';
import { logger } from '../../shared/logger';

interface RedshiftErrorDetails {
  Error: string;
  Status: string;
  QueryString: string;
  Database: string;
  WorkgroupName: string;
}

export const handler = async (event: CloudWatchLogsEvent): Promise<void> => {
  logger.info('Redshift error notification lambda invoked');
  try {
    const compressed = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = gunzipSync(compressed as InputType);
    const logData: CloudWatchLogsDecodedData = JSON.parse(decompressed.toString());

    for (const logEvent of logData.logEvents) {
      const message = JSON.parse(logEvent.message);

      if (message.details?.output) {
        const parsedOutput = JSON.parse(message.details.output);

        if (parsedOutput.sql_output) {
          const output: RedshiftErrorDetails = parsedOutput.sql_output;

          if (output.Status === 'FAILED' && output.Error) {
            logger.error('Redshift stored procedure failure detected', {
              database: output.Database,
              workgroupName: output.WorkgroupName,
              executionArn: message.execution_arn ?? 'N/A',
            });

            const customNotification = {
              version: '1.0',
              source: 'custom',
              content: {
                textType: 'client-markdown',
                title: ':Alert: Redshift Stored Procedure Failure :Alert:',
                description: `*Database:* ${output.Database}\n*Query:* ${output.QueryString}\n\n*Error:* ${output.Error}\n\n*Execution:* \`${message.execution_arn || 'N/A'}\``,
              },
            };

            const command = new PutEventsCommand({
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
            });
            await eventbridgeClient.send(command);
            logger.info('Redshift error notification sent to EventBridge', { database: output.Database });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error processing redshift error notification', {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw error;
  }
};
