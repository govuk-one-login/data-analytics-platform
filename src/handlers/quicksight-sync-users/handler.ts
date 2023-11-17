import { getLogger } from '../../shared/powertools';
import type { Context } from 'aws-lambda';
import { cognitoClient, quicksightClient } from '../../shared/clients';
import {
  DeleteUserCommand,
  DescribeUserCommand,
  RegisterUserCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-quicksight';
import { getAccountId, getEnvironmentVariable } from '../../shared/utils/utils';
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';

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

class SyncStatus {
  existsInCognito: boolean;
  existsInQuicksight: boolean;

  constructor(existsInCognito: boolean, existsInQuicksight: boolean) {
    this.existsInCognito = existsInCognito;
    this.existsInQuicksight = existsInQuicksight;
  }

  existsInBoth = (): boolean => this.existsInCognito && this.existsInQuicksight;

  existsInOnlyOne = (): boolean =>
    (this.existsInCognito && !this.existsInQuicksight) || (!this.existsInCognito && this.existsInQuicksight);

  existsInNeither = (): boolean => !this.existsInCognito && !this.existsInQuicksight;
}

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
  const status = await getUserStatus(user, userPoolId, accountId);
  if (status.existsInOnlyOne()) {
    const existsIn = status.existsInQuicksight ? 'Quicksight' : 'Cognito';
    const missingIn = existsIn === 'Cognito' ? 'Quicksight' : 'Cognito';
    return { user, error: `User exists in ${existsIn} but not in ${missingIn} - please resolve manually` };
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

const getUserStatus = async (user: SyncUser, userPoolId: string, accountId: string): Promise<SyncStatus> => {
  const cognito = await existsInCognito(user.username, userPoolId);
  const quicksight = await existsInQuicksight(user.username, accountId);
  return new SyncStatus(cognito, quicksight);
};

const existsInCognito = async (username: string, userPoolId: string): Promise<boolean> => {
  const request = new AdminGetUserCommand({
    UserPoolId: userPoolId,
    Username: username,
  });
  try {
    return await cognitoClient.send(request).then(response => response.Username !== undefined);
  } catch (error) {
    if (error instanceof UserNotFoundException) {
      return false;
    }
    throw error;
  }
};

const existsInQuicksight = async (username: string, accountId: string): Promise<boolean> => {
  const request = new DescribeUserCommand({
    UserName: username,
    AwsAccountId: accountId,
    Namespace: 'default',
  });
  try {
    return await quicksightClient.send(request).then(response => response.User?.UserName !== undefined);
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return false;
    }
    throw error;
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
