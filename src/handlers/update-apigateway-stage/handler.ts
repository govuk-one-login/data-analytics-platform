import { ApiGatewayV2Client, UpdateStageCommand } from '@aws-sdk/client-apigatewayv2';
import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import * as https from 'https';
import { getLogger } from '../../shared/powertools';

const client = new ApiGatewayV2Client({ region: 'eu-west-2' });
export const logger = getLogger('lambda/update-apigateway-stage');

export const handler = async (event: CloudFormationCustomResourceEvent, context: Context): Promise<void> => {
  try {
    logger.info('Event received', {
      RequestType: event.RequestType,
      LogicalResourceId: event.LogicalResourceId,
      RequestId: event.RequestId,
    });

    const { RequestType, ResourceProperties } = event;

    if (!ResourceProperties) {
      logger.error('ResourceProperties missing from event');
      await sendResponse(event, context, 'FAILED', {})
        .then(() => logger.info('FAILED response sent for missing ResourceProperties'))
        .catch(err => logger.error('Failed to send response for missing ResourceProperties', { error: err }));
      return;
    }

    const { ApiId, StageName, LogGroupArn } = ResourceProperties;

    if (!ApiId || !StageName || !LogGroupArn) {
      logger.error('Required properties missing', { ApiId, StageName, LogGroupArn });
      await sendResponse(event, context, 'FAILED', {})
        .then(() => logger.info('FAILED response sent for missing properties'))
        .catch(err => logger.error('Failed to send response for missing properties', { error: err }));
      return;
    }

    logger.info('Processing request', { RequestType, ApiId, StageName, LogGroupArn });

    try {
      if (RequestType === 'Create' || RequestType === 'Update') {
        logger.info('Updating API Gateway stage', { ApiId, StageName });
        const command = new UpdateStageCommand({
          ApiId,
          StageName,
          AccessLogSettings: {
            DestinationArn: LogGroupArn,
            Format:
              '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","path":"$context.path","routeKey":"$context.routeKey","status":"$context.status","protocol":"$context.protocol","responseLatency":"$context.responseLatency","responseLength":"$context.responseLength"}',
          },
        });

        logger.info('Sending UpdateStageCommand to API Gateway');

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            logger.error('API Gateway call timed out after 20 seconds');
            reject(new Error('API Gateway call timeout'));
          }, 20000);
        });

        await Promise.race([client.send(command), timeoutPromise])
          .then(result => {
            logger.info('API Gateway UpdateStage response', { result });
          })
          .catch(apiError => {
            logger.error('API Gateway UpdateStage failed', {
              error: String(apiError),
              errorName: apiError?.name,
              errorMessage: apiError?.message,
              errorCode: apiError?.$metadata?.httpStatusCode,
            });
            throw apiError;
          });
        logger.info('Successfully updated stage', { StageName, ApiId });
      } else {
        logger.info('Skipping stage update for Delete request');
      }

      logger.info('Sending SUCCESS response to CloudFormation');
      await sendResponse(event, context, 'SUCCESS', {})
        .then(() => {
          logger.info('SUCCESS response sent successfully');
        })
        .catch(responseError => {
          logger.error('Failed to send SUCCESS response', { error: responseError });
          throw responseError;
        });
    } catch (error) {
      logger.error('Error updating stage', { error });
      logger.info('Sending FAILED response to CloudFormation');
      await sendResponse(event, context, 'FAILED', {})
        .then(() => {
          logger.info('FAILED response sent successfully');
        })
        .catch(responseError => {
          logger.error('Failed to send FAILED response', { error: responseError });
        });
    }
  } catch (unexpectedError) {
    logger.error('Unexpected error in handler', { error: unexpectedError });
    await sendResponse(event, context, 'FAILED', {})
      .then(() => {
        logger.info('Emergency FAILED response sent successfully');
      })
      .catch(responseError => {
        logger.error('Failed to send emergency error response', { error: responseError });
      });
  }
};

async function sendResponse(
  event: CloudFormationCustomResourceEvent,
  context: Context,
  responseStatus: string,
  responseData: Record<string, unknown>,
): Promise<void> {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: `See CloudWatch Log Stream: ${context.logStreamName}`,
    PhysicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  });

  const parsedUrl = new URL(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'Content-Length': responseBody.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      logger.info('CloudFormation response sent', { statusCode: res.statusCode });
      resolve();
    });

    req.on('error', err => {
      logger.error('Error sending CloudFormation response', { error: err });
      reject(err);
    });

    req.write(responseBody);
    req.end();
  });
}
