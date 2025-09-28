import { ApiGatewayV2Client, UpdateStageCommand } from '@aws-sdk/client-apigatewayv2';
import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import * as https from 'https';
import { getLogger } from '@aws-lambda-powertools/logger';

const client = new ApiGatewayV2Client({ region: process.env.AWS_REGION });
const logger = getLogger('lambda/update-apigateway-stage');

export const handler = async (event: CloudFormationCustomResourceEvent, context: Context): Promise<void> => {
  logger.info('Event received', { event });

  const { RequestType, ResourceProperties } = event;
  const { ApiId, StageName, LogGroupArn } = ResourceProperties;

  try {
    if (RequestType === 'Create' || RequestType === 'Update') {
      const command = new UpdateStageCommand({
        ApiId,
        StageName,
        AccessLogSettings: {
          DestinationArn: LogGroupArn,
          Format:
            '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","path":"$context.path","routeKey":"$context.routeKey","status":"$context.status","protocol":"$context.protocol","responseLatency":"$context.responseLatency","responseLength":"$context.responseLength"}',
        },
      });

      await client.send(command);
      logger.info('Successfully updated stage', { StageName, ApiId });
    }

    await sendResponse(event, context, 'SUCCESS', {});
  } catch (error) {
    logger.error('Error updating stage', { error });
    await sendResponse(event, context, 'FAILED', {});
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
    PhysicalResourceId: context.logStreamName,
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
