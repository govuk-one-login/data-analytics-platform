import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { gunzipSync, InputType } from 'node:zlib';
import { eventbridgeClient } from '../../shared/clients';

interface RedshiftErrorDetails {
  Error: string;
  Status: string;
  QueryString: string;
  Database: string;
  WorkgroupName: string;
}

export const handler = async (event: CloudWatchLogsEvent): Promise<void> => {
  // Decode the CloudWatch Logs data
  const compressed = Buffer.from(event.awslogs.data, 'base64');
  const decompressed = gunzipSync(compressed as InputType);
  const logData: CloudWatchLogsDecodedData = JSON.parse(decompressed.toString());

  for (const logEvent of logData.logEvents) {
    const message = JSON.parse(logEvent.message);

    // Extract error details from the Step Functions log
    if (message.details?.output) {
      const parsedOutput = JSON.parse(message.details.output);

      if (parsedOutput.sql_output) {
        const output: RedshiftErrorDetails = parsedOutput.sql_output;

        if (output.Status === 'FAILED' && output.Error) {
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
          await eventbridgeClient.send(command);
        }
      }
    }
  }
};
