import {
  AdminUpdateUserAttributesCommand,
  AdminUpdateUserAttributesCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '../../shared/clients';
import { logger, initialiseLogger } from '../../shared/logger';
import { Context, PostAuthenticationTriggerEvent } from 'aws-lambda';
import { buildErrorMetadata, getRequiredParams } from '../../shared/utils/utils';
import { ERROR_CODES } from '../../shared/error-codes';

export { logger } from '../../shared/logger';

export const handler = async (
  event: PostAuthenticationTriggerEvent,
  context?: Context,
): Promise<PostAuthenticationTriggerEvent> => {
  if (context !== undefined) {
    initialiseLogger(context);
  }
  const startTime = Date.now();
  const correlationId = context?.awsRequestId;
  logger.info('Handler started', {
    correlationId,
    userPoolId: event.userPoolId,
    userName: event.userName,
  });

  try {
    const updateAttributesCommand = getUpdateAttributesCommand(event);
    await cognitoClient.send(new AdminUpdateUserAttributesCommand(updateAttributesCommand));
    logger.info('Handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Error in post authentication lambda', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.POST_AUTHENTICATION_FAILED),
    });
  }
  return event;
};

const getUpdateAttributesCommand = (event: PostAuthenticationTriggerEvent): AdminUpdateUserAttributesCommandInput => {
  const { userPoolId, userName } = getRequiredParams(event, 'userPoolId', 'userName');
  return {
    UserPoolId: userPoolId,
    Username: userName,
    UserAttributes: [
      {
        Name: 'custom:last_login',
        Value: Date.now().toString(),
      },
    ],
  };
};
