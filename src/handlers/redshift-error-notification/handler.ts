import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { PublishCommand } from '@aws-sdk/client-sns';
import { gunzipSync } from 'zlib';
import { snsClient } from '../../shared/clients';
import { getLogger } from '../../shared/powertools';

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
      if (message.sql_output) {
        const output: RedshiftErrorDetails = message.sql_output;
        logger.info('sql_output object: ', JSON.stringify(output));
        logger.info('output.Status: ', output.Status);
        logger.info('output.Error: ', output.Error);
        if (output.Status === 'FAILED' && output.Error) {
          // Format detailed error message
          const errorMessage = `
🚨 **Redshift Stored Procedure Failure**

**Step Function:** dap-consolidated-stage-layer-to-redshift-processing
**Database:** ${output.Database}
**Workgroup:** ${output.WorkgroupName}
**Query:** ${output.QueryString}

**Error Details:**
${output.Error}

**Execution ARN:** ${message.execution_arn || 'N/A'}
**Timestamp:** ${new Date(logEvent.timestamp).toISOString()}
          `.trim();
          logger.info('errorMessage to be sent to slack: ', errorMessage);
          // Send to SNS
          await snsClient.send(
            new PublishCommand({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Message: errorMessage,
              Subject: 'DAP Redshift Stored Procedure Failure',
            }),
          );
        }
      }
    }
  } catch (error) {
    logger.error('Error processing Redshift error notification:', error);
    throw error;
  }
};
