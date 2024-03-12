import { getLogger } from '../../shared/powertools';
import type { Context } from 'aws-lambda';
import { cognitoClient, quicksightClient } from '../../shared/clients';
import { CreateGroupMembershipCommand, ListGroupsCommand, RegisterUserCommand } from '@aws-sdk/client-quicksight';
import type { CreateGroupMembershipCommandOutput, RegisterUserCommandOutput } from '@aws-sdk/client-quicksight';
import { AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { AdminCreateUserCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { ensureDefined, getAccountId, getEnvironmentVariable, getErrorMessage } from '../../shared/utils/utils';
import { getUserStatus } from '../../shared/quicksight-access/user-status';

const logger = getLogger('lambda/quicksight-add-users');

interface AddUserRequest {
  username: string;
  email: string;
  quicksightGroups: string[];
}

export interface AddUsersEvent {
  requests: AddUserRequest[];
}

export interface AddUserResult extends AddUserRequest {
  error?: string;
}

export const handler = async (event: AddUsersEvent, context: Context): Promise<AddUserResult[]> => {
  try {
    const accountId = getAccountId(context);
    const userPoolId = getEnvironmentVariable('USER_POOL_ID');
    const allGroups = await getAllQuicksightGroups(accountId);
    return await Promise.all(event.requests.map(async user => await addUser(user, userPoolId, accountId, allGroups)));
  } catch (error) {
    logger.error('Error preparing to add users', { error });
    throw error;
  }
};

// do not rethrow caught errors as we want to process all users and return all SyncResults rather than return early
const addUser = async (
  request: AddUserRequest,
  userPoolId: string,
  accountId: string,
  allGroups: string[],
): Promise<AddUserResult> => {
  try {
    const nonExistentGroups = request.quicksightGroups.filter(group => !allGroups.includes(group));
    if (nonExistentGroups.length > 0) {
      const missingGroupsMessage = `The following groups do not exist in Quicksight [${nonExistentGroups.join(', ')}]`;
      return { ...request, error: `${missingGroupsMessage} - please review the request` };
    }

    const status = await getUserStatus(request.username, userPoolId, accountId);
    if (!status.existsInNeither()) {
      return { ...request, error: `${status.existenceMessage()} - please resolve manually` };
    }

    await addCognitoUser(request, userPoolId).catch(error => {
      throw new Error(`${error.message} (Failed creating Cognito user - nothing created)`);
    });
    await addQuicksightUser(request, accountId).catch(error => {
      throw new Error(`${error.message} (Failed creating Quicksight user - Cognito user created)`);
    });
    for (const group of request.quicksightGroups) {
      if (!status.quicksightGroups.includes(group)) {
        await addToQuicksightGroup(request.username, group, accountId).catch(error => {
          throw new Error(`${error.message} (Failed adding user to group - Cognito and Quicksight users created)`);
        });
      }
    }
    return { ...request };
  } catch (error) {
    return { ...request, error: getErrorMessage(error) };
  }
};

const addCognitoUser = async (user: AddUserRequest, userPoolId: string): Promise<AdminCreateUserCommandOutput> => {
  const request = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: user.username,
    UserAttributes: [
      {
        Name: 'email',
        Value: user.email,
      },
      {
        Name: 'email_verified',
        Value: 'true',
      },
    ],
    DesiredDeliveryMediums: ['EMAIL'],
  });
  return await cognitoClient.send(request);
};

const addQuicksightUser = async (user: AddUserRequest, accountId: string): Promise<RegisterUserCommandOutput> => {
  const request = new RegisterUserCommand({
    ...baseQuicksightParams(accountId),
    UserName: user.username,
    Email: user.email,
    IdentityType: 'QUICKSIGHT',
    UserRole: 'READER',
  });
  return await quicksightClient.send(request);
};

const addToQuicksightGroup = async (
  username: string,
  groupName: string,
  accountId: string,
): Promise<CreateGroupMembershipCommandOutput> => {
  const request = new CreateGroupMembershipCommand({
    ...baseQuicksightParams(accountId),
    MemberName: username,
    GroupName: groupName,
  });
  return await quicksightClient.send(request);
};

const getAllQuicksightGroups = async (accountId: string): Promise<string[]> => {
  return await quicksightClient
    .send(new ListGroupsCommand(baseQuicksightParams(accountId)))
    .then(response => response.GroupList ?? [])
    .then(groups => groups.map(group => ensureDefined(() => group.GroupName)));
};

const baseQuicksightParams = (accountId: string): { AwsAccountId: string; Namespace: string } => {
  return { AwsAccountId: accountId, Namespace: 'default' };
};
