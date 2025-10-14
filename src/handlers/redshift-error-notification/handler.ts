import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { gunzipSync } from 'zlib';
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
    logger.info('Inside handler: ', JSON.stringify(event));

    // Decode the CloudWatch Logs data
    const compressed = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = gunzipSync(compressed);
    const logData: CloudWatchLogsDecodedData = JSON.parse(decompressed.toString());
    logger.info('logData: ', logData);

    for (const logEvent of logData.logEvents) {
      const message = JSON.parse(logEvent.message);
      logger.info('for loop message: ', message);

      // Extract error details from the Step Functions log
      if (message.details?.output) {
        const parsedOutput = JSON.parse(message.details.output);
        logger.info('parsedOutput: ', JSON.stringify(parsedOutput));

        if (parsedOutput.sql_output) {
          const output: RedshiftErrorDetails = parsedOutput.sql_output;
          logger.info('sql_output object: ', JSON.stringify(output));
          logger.info('output.Status: ', output.Status);
          logger.info('output.Error: ', output.Error);
          if (output.Status === 'FAILED' && output.Error) {
            // Format as AWS Chatbot custom notification
            const customNotification = {
              version: '1.0',
              source: 'custom',
              content: {
                textType: 'client-markdown',
                title: '🚨 **Redshift Stored Procedure Failure**',
                description: `**Database:** ${output.Database}\n**Query:** ${output.QueryString}\n\n**Error:** ${output.Error}\n\n**Execution:** ${message.execution_arn || 'N/A'}`,
              },
            };
            const errorMessage = JSON.stringify(customNotification);
            logger.info('errorMessage to be sent to slack: ', errorMessage);
            logger.info('About to send SNS message to topic: ', process.env.SNS_TOPIC_ARN);

            // Send to SNS
            try {
              logger.info('Creating PublishCommand...');
              const command = new PublishCommand({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Message: errorMessage,
                Subject: 'DAP Redshift Stored Procedure Failure',
              });

              logger.info('Sending SNS command...');
              const result = await snsClient.send(command);
              logger.info('SNS publish successful: ', result);
            } catch (snsError) {
              logger.error('SNS publish failed: ', snsError);
              throw snsError;
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error processing Redshift error notification:', error);
    throw error;
  }
};
