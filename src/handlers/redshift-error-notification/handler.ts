import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { PublishCommand } from '@aws-sdk/client-sns';
import { Logger } from '@aws-lambda-powertools/logger';
import { gunzipSync } from 'zlib';
import { snsClient } from '../../shared/clients';

const logger = new Logger({ serviceName: 'redshift-error-notification' });

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
        const output: RedshiftErrorDetails = JSON.parse(message.details.output);

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
