import { AdminGetUserCommand, UserNotFoundException } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, quicksightClient } from '../clients';
import { DescribeUserCommand, ListUserGroupsCommand, ResourceNotFoundException } from '@aws-sdk/client-quicksight';

export class UserStatus {
  existsInCognito: boolean;
  existsInQuicksight: boolean;
  quicksightGroups: string[];

  constructor(existsInCognito: boolean, existsInQuicksight: boolean, quicksightGroups: string[]) {
    this.existsInCognito = existsInCognito;
    this.existsInQuicksight = existsInQuicksight;
    this.quicksightGroups = quicksightGroups;
  }

  existsInBoth(): boolean {
    return this.existsInCognito && this.existsInQuicksight;
  }

  existsInOnlyOne(): boolean {
    return (this.existsInCognito && !this.existsInQuicksight) || (!this.existsInCognito && this.existsInQuicksight);
  }

  existsInNeither(): boolean {
    return !this.existsInCognito && !this.existsInQuicksight;
  }

  existenceMessage = (): string => {
    if (this.existsInNeither()) {
      return 'User does not exist in Cognito or Quicksight';
    } else if (this.existsInBoth()) {
      return 'User exists in Cognito and Quicksight';
    } else {
      const existsIn = this.existsInQuicksight ? 'Quicksight' : 'Cognito';
      const missingIn = existsIn === 'Cognito' ? 'Quicksight' : 'Cognito';
      return `User exists in ${existsIn} but not in ${missingIn}`;
    }
  };
}

export const getUserStatus = async (username: string, userPoolId: string, accountId: string): Promise<UserStatus> => {
  const cognito = await existsInCognito(username, userPoolId);
  const quicksight = await existsInQuicksight(username, accountId);
  const quicksightGroups = await getQuicksightGroups(username, accountId);
  return new UserStatus(cognito, quicksight, quicksightGroups);
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

const getQuicksightGroups = async (username: string, accountId: string): Promise<string[]> => {
  const request = new ListUserGroupsCommand({
    UserName: username,
    AwsAccountId: accountId,
    Namespace: 'default',
  });
  try {
    return await quicksightClient
      .send(request)
      .then(response => response.GroupList ?? [])
      .then(groups => groups?.map(group => group.GroupName ?? '').filter(name => name.length > 0));
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return [];
    }
    throw error;
  }
};
