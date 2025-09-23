import {
  AdminUpdateUserAttributesCommand,
  AdminUpdateUserAttributesCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '../../../common/clients';
import { getLogger } from '../../../common/services/powertools/powertools';
import { PostAuthenticationTriggerEvent } from 'aws-lambda';
import { getRequiredParams } from '../../../common/utilities/utils';

export const logger = getLogger('lambda/cognito-post-authentication');

export const handler = async (event: PostAuthenticationTriggerEvent): Promise<PostAuthenticationTriggerEvent> => {
  try {
    const updateAttributesCommand = getUpdateAttributesCommand(event);
    await cognitoClient.send(new AdminUpdateUserAttributesCommand(updateAttributesCommand));
  } catch (error) {
    logger.error('Error in post authentication lambda', { error });
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
