import { UserStatus, getUserStatus } from './user-status';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  QuickSightClient,
  DescribeUserCommand,
  ListUserGroupsCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-quicksight';

const mockCognitoClient = mockClient(CognitoIdentityProviderClient);
const mockQuickSightClient = mockClient(QuickSightClient);

const TEST_USERNAME = 'testuser';
const TEST_USER_POOL_ID = 'user-pool-id';
const TEST_ACCOUNT_ID = 'account-id';

beforeEach(() => {
  mockCognitoClient.reset();
  mockQuickSightClient.reset();
});

describe('UserStatus class', () => {
  test('existsInOnlyOne returns true when user exists in only one service', () => {
    const status1 = new UserStatus(true, false, []);
    const status2 = new UserStatus(false, true, []);

    expect(status1.existsInOnlyOne()).toBe(true);
    expect(status2.existsInOnlyOne()).toBe(true);
  });

  test('existenceMessage returns correct message for user in neither service', () => {
    const status = new UserStatus(false, false, []);
    expect(status.existenceMessage()).toBe('User does not exist in Cognito or Quicksight');
  });

  test('existenceMessage returns correct message for user in both services', () => {
    const status = new UserStatus(true, true, []);
    expect(status.existenceMessage()).toBe('User exists in Cognito and Quicksight');
  });

  test('existenceMessage returns correct message for user only in Cognito', () => {
    const status = new UserStatus(true, false, []);
    expect(status.existenceMessage()).toBe('User exists in Cognito but not in Quicksight');
  });

  test('existenceMessage returns correct message for user only in Quicksight', () => {
    const status = new UserStatus(false, true, []);
    expect(status.existenceMessage()).toBe('User exists in Quicksight but not in Cognito');
  });
});

describe('getUserStatus function', () => {
  test('user exists in both services with groups', async () => {
    mockCognitoClient.on(AdminGetUserCommand).resolves({ Username: TEST_USERNAME });
    mockQuickSightClient.on(DescribeUserCommand).resolves({ User: { UserName: TEST_USERNAME } });
    mockQuickSightClient.on(ListUserGroupsCommand).resolves({
      GroupList: [{ GroupName: 'group1' }, { GroupName: 'group2' }],
    });

    const status = await getUserStatus(TEST_USERNAME, TEST_USER_POOL_ID, TEST_ACCOUNT_ID);

    expect(status.existsInCognito).toBe(true);
    expect(status.existsInQuicksight).toBe(true);
    expect(status.quicksightGroups).toEqual(['group1', 'group2']);
  });

  test('user does not exist in Cognito', async () => {
    mockCognitoClient.on(AdminGetUserCommand).rejects(new UserNotFoundException({ message: 'User not found' }));
    mockQuickSightClient.on(DescribeUserCommand).resolves({ User: { UserName: TEST_USERNAME } });
    mockQuickSightClient.on(ListUserGroupsCommand).resolves({ GroupList: [] });

    const status = await getUserStatus(TEST_USERNAME, TEST_USER_POOL_ID, TEST_ACCOUNT_ID);

    expect(status.existsInCognito).toBe(false);
    expect(status.existsInQuicksight).toBe(true);
  });

  test('user does not exist in QuickSight', async () => {
    mockCognitoClient.on(AdminGetUserCommand).resolves({ Username: TEST_USERNAME });
    mockQuickSightClient.on(DescribeUserCommand).rejects(new ResourceNotFoundException({ message: 'User not found' }));
    mockQuickSightClient
      .on(ListUserGroupsCommand)
      .rejects(new ResourceNotFoundException({ message: 'User not found' }));

    const status = await getUserStatus(TEST_USERNAME, TEST_USER_POOL_ID, TEST_ACCOUNT_ID);

    expect(status.existsInCognito).toBe(true);
    expect(status.existsInQuicksight).toBe(false);
    expect(status.quicksightGroups).toEqual([]);
  });
});
