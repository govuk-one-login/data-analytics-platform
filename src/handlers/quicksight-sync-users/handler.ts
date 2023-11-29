import { getLogger } from '../../shared/powertools';
import type { Context } from 'aws-lambda';
import { cognitoClient, quicksightClient } from '../../shared/clients';
import { DeleteUserCommand, RegisterUserCommand } from '@aws-sdk/client-quicksight';
import { getAccountId, getEnvironmentVariable } from '../../shared/utils/utils';
import { AdminCreateUserCommand, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getUserStatus } from '../../shared/quicksight-access/user-status';

const logger = getLogger('lambda/quicksight-sync-users');

export interface SyncEvent {
  diff: string;
}

export interface SyncUser {
  username: string;
  email: string;
  action: SyncAction;
}

type SyncAction = 'ADD' | 'REMOVE';

interface SyncResult {
  user: SyncUser;
  error?: string;
}

export const handler = async (event: SyncEvent, context: Context): Promise<SyncResult[]> => {
  try {
    const accountId = getAccountId(context);
    const userPoolId = getEnvironmentVariable('USER_POOL_ID');
    const userList = getUsersFromDiff(event);
    return await Promise.all(userList.map(async user => await syncUser(user, userPoolId, accountId)));
  } catch (error) {
    logger.error('Error preparing for user sync', { error });
    throw error;
  }
};

const syncUser = async (user: SyncUser, userPoolId: string, accountId: string): Promise<SyncResult> => {
  const status = await getUserStatus(user.username, userPoolId, accountId);
  if (status.existsInOnlyOne()) {
    return { user, error: `${status.existenceMessage()} - please resolve manually` };
  } else if (status.existsInBoth() && user.action === 'ADD') {
    return { user, error: `User to ADD already exists in Cognito and Quicksight` };
  } else if (status.existsInNeither() && user.action === 'REMOVE') {
    return { user, error: `User to REMOVE does not exist in Cognito or Quicksight` };
  }

  // do not rethrow caught errors as we want to process all users and return all SyncResults rather than return early
  try {
    await cognitoClient.send(getCognitoRequest(user, userPoolId));
    // @ts-expect-error typescript complains that a registeruser input cannot yield a deleteuser output
    // not sure why a similar error is not emitted when using getCognitoRequest
    await quicksightClient.send(getQuicksightRequest(user, accountId));
    return { user };
  } catch (error) {
    return { user, error: error instanceof Error ? error.message : JSON.stringify(error) };
  }
};

// exported for testing
export const getUsersFromDiff = (event: SyncEvent): SyncUser[] => {
  return event.diff
    .split('\n')
    .filter(line => line.match(/^[+-][^+-].*$/))
    .map(line => [line.charAt(0), line.substring(1).split(',')].flat())
    .map(([diffChar, username, email]) => ({
      username: username.trim(),
      email: email.trim(),
      action: diffChar === '+' ? 'ADD' : 'REMOVE',
    }));
};

type CognitoRequest = AdminCreateUserCommand | AdminDeleteUserCommand;

const getCognitoRequest = (user: SyncUser, userPoolId: string): CognitoRequest => {
  const baseInput = {
    UserPoolId: userPoolId,
    Username: user.username,
  };
  if (user.action === 'REMOVE') {
    return new AdminDeleteUserCommand({ ...baseInput });
  } else {
    return new AdminCreateUserCommand({
      ...baseInput,
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
  }
};

type QuicksightRequest = RegisterUserCommand | DeleteUserCommand;

const getQuicksightRequest = (user: SyncUser, accountId: string): QuicksightRequest => {
  const baseRequestInput = {
    UserName: user.username,
    AwsAccountId: accountId,
    Namespace: 'default',
  };
  if (user.action === 'REMOVE') {
    return new DeleteUserCommand({ ...baseRequestInput });
  } else {
    return new RegisterUserCommand({
      ...baseRequestInput,
      Email: user.email,
      IdentityType: 'QUICKSIGHT',
      UserRole: 'READER',
    });
  }
};
