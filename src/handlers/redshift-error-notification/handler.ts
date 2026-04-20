import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { gunzipSync, InputType } from 'node:zlib';
import { getLogger } from '../../shared/powertools';
import { eventbridgeClient } from '../../shared/clients';

const logger = getLogger('lambda/redshift-error-notification');

interface RedshiftErrorDetails {
  Error: string;
  Status: string;
  QueryString: string;
  Database: string;
  WorkgroupName: string;
}

export const handler = async (event: CloudWatchLogsEvent): Promise<void> => {
  logger.info('Handler invoked with event', { event });

  try {
    // Decode the CloudWatch Logs data
    const compressed = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = gunzipSync(compressed as InputType);
    const logData: CloudWatchLogsDecodedData = JSON.parse(decompressed.toString());

    logger.info('Decoded log data', { logData });

    for (const logEvent of logData.logEvents) {
      logger.info('Processing log event', { logEvent });

      const message = JSON.parse(logEvent.message);
      logger.info('Parsed message', { message });

      // Extract error details from the Step Functions log
      if (message.details?.output) {
        logger.info('Found details.output', { output: message.details.output });

        const parsedOutput = JSON.parse(message.details.output);
        logger.info('Parsed output', { parsedOutput });

        if (parsedOutput.sql_output) {
          logger.info('Found sql_output', { sql_output: parsedOutput.sql_output });

          const output: RedshiftErrorDetails = parsedOutput.sql_output;
          logger.info('Status and Error check', { status: output.Status, hasError: !!output.Error });

          if (output.Status === 'FAILED' && output.Error) {
            logger.info('Conditions met - sending notification to EventBridge');

            // Format as AWS Chatbot custom notification
            const customNotification = {
              version: '1.0',
              source: 'custom',
              content: {
                textType: 'client-markdown',
                title: ':Alert: Redshift Stored Procedure Failure :Alert:',
                description: `*Database:* ${output.Database}\n*Query:* ${output.QueryString}\n\n*Error:* ${output.Error}\n\n*Execution:* \`${message.execution_arn || 'N/A'}\``,
              },
            };

            // Send to EventBridge
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

            logger.info('Sending EventBridge command', { command });
            const result = await eventbridgeClient.send(command);
            logger.info('EventBridge response', { result });
          } else {
            logger.info('Conditions not met', { status: output.Status, hasError: !!output.Error });
          }
        } else {
          logger.info('No sql_output found in parsed output');
        }
      } else {
        logger.info('No details.output found in message');
      }
    }
  } catch (error) {
    logger.error('Error in handler', { error });
    throw error;
  }
};
