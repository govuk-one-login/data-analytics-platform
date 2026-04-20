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
  console.log('Handler invoked with event:', JSON.stringify(event, null, 2));
  
  try {
    // Decode the CloudWatch Logs data
    const compressed = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = gunzipSync(compressed as InputType);
    const logData: CloudWatchLogsDecodedData = JSON.parse(decompressed.toString());
    
    console.log('Decoded log data:', JSON.stringify(logData, null, 2));

    for (const logEvent of logData.logEvents) {
      console.log('Processing log event:', JSON.stringify(logEvent, null, 2));
      
      const message = JSON.parse(logEvent.message);
      console.log('Parsed message:', JSON.stringify(message, null, 2));

      // Extract error details from the Step Functions log
      if (message.details?.output) {
        console.log('Found details.output:', message.details.output);
        
        const parsedOutput = JSON.parse(message.details.output);
        console.log('Parsed output:', JSON.stringify(parsedOutput, null, 2));

        if (parsedOutput.sql_output) {
          console.log('Found sql_output:', JSON.stringify(parsedOutput.sql_output, null, 2));
          
          const output: RedshiftErrorDetails = parsedOutput.sql_output;
          console.log('Status:', output.Status, 'Error:', output.Error);
          
          if (output.Status === 'FAILED' && output.Error) {
            console.log('Conditions met - sending notification to EventBridge');
            
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

            console.log('Sending EventBridge command:', JSON.stringify(command, null, 2));
            const result = await eventbridgeClient.send(command);
            console.log('EventBridge response:', JSON.stringify(result, null, 2));
          } else {
            console.log('Conditions not met - Status:', output.Status, 'Error present:', !!output.Error);
          }
        } else {
          console.log('No sql_output found in parsed output');
        }
      } else {
        console.log('No details.output found in message');
      }
    }
  } catch (error) {
    console.error('Error in handler:', error);
    logger.error('Error processing Redshift error notification:', error as Error);
    throw error;
  }
};
