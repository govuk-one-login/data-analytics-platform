import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { gunzipSync } from 'node:zlib';
import { getLogger } from '../../shared/powertools';

// Create SNS client with timeout
const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  requestHandler: {
    requestTimeout: 10000, // 10 seconds
  },
});

const logger = getLogger('lambda/redshift-error-notification');

interface RedshiftErrorDetails {
  Error: string;
  Status: string;
  QueryString: string;
  Database: string;
  WorkgroupName: string;
}

export const handler = async (event: CloudWatchLogsEvent): Promise<void> => {
  try {
    // Decode the CloudWatch Logs data
    const compressed = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = gunzipSync(compressed);
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
            const errorMessage = JSON.stringify(customNotification);

            // Send to SNS
            const command = new PublishCommand({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Message: errorMessage,
              Subject: 'DAP Redshift Stored Procedure Failure',
            });

            await snsClient.send(command);
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error processing Redshift error notification:', error);
    throw error;
  }
};
