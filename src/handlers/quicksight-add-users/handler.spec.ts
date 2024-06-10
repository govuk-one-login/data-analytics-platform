import { handler } from './handler';
import type { Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CreateGroupMembershipCommand,
  DescribeUserCommand,
  ListGroupsCommand,
  ListUserGroupsCommand,
  QuickSightClient,
  RegisterUserCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-quicksight';
import { mockCognitoUser } from '../../shared/utils/test-utils';

const ACCOUNT_ID = '123456789012';

const CONTEXT: Context = {
  invokedFunctionArn: `arn:aws:lambda:eu-west-2:${ACCOUNT_ID}:function:LambdaFunctionName`,
} as unknown as Context;

const USER_POOL_ID = 'user-pool-id';

const mockCognitoClient = mockClient(CognitoIdentityProviderClient);
const mockQuicksightClient = mockClient(QuickSightClient);

beforeEach(() => {
  mockCognitoClient.reset();
  mockCognitoClient.callsFake(input => {
    throw new Error(`Unexpected Cognito request - ${JSON.stringify(input)}`);
  });

  mockQuicksightClient.reset();
  mockQuicksightClient.callsFake(input => {
    throw new Error(`Unexpected Quicksight request - ${JSON.stringify(input)}`);
  });
  process.env.USER_POOL_ID = USER_POOL_ID;
});

test('missing account id', async () => {
  await expect(handler({ requests: [] }, { ...CONTEXT, invokedFunctionArn: '' })).rejects.toThrow(
    'Error extracting account id from lambda ARN',
  );
});

test('missing user pool id', async () => {
  process.env.USER_POOL_ID = '';
  await expect(handler({ requests: [] }, CONTEXT)).rejects.toThrow('USER_POOL_ID is not defined in this environment');
});

test('error getting all groups', async () => {
  mockQuicksightClient.on(ListGroupsCommand).rejects('Quicksight list groups error');

  await expect(handler({ requests: [] }, CONTEXT)).rejects.toThrow('Quicksight list groups error');

  expect(mockQuicksightClient.calls()).toHaveLength(1);
});

test('successes', async () => {
  mockCognitoClient
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))

    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .resolves({})
    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .resolves({})
    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .resolves({});

  mockQuicksightClient
    .on(ListGroupsCommand)
    .resolves({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))

    .on(ListUserGroupsCommand, { UserName: 'user-a' })
    .resolves({ GroupList: [] })
    .on(ListUserGroupsCommand, { UserName: 'user-b' })
    .resolves({ GroupList: [{ GroupName: 'group-one' }] })
    .on(ListUserGroupsCommand, { UserName: 'user-c' })
    .resolves({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(RegisterUserCommand, { UserName: 'user-a' })
    .resolves({})
    .on(RegisterUserCommand, { UserName: 'user-b' })
    .resolves({})
    .on(RegisterUserCommand, { UserName: 'user-c' })
    .resolves({})

    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-one' })
    .resolves({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-two' })
    .resolves({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-b', GroupName: 'group-two' })
    .resolves({});

  // user a should be created and added to both groups
  // user b should be created and added to group-two (already in group-one)
  // user c should be created and not added to any groups (already in group-one and group-two)
  const quicksightGroups = ['group-one', 'group-two'];
  const event = {
    requests: [
      { username: 'user-a', email: 'a@a.com', quicksightGroups },
      { username: 'user-b', email: 'b@b.com', quicksightGroups },
      { username: 'user-c', email: 'c@c.com', quicksightGroups },
    ],
  };

  const response = await handler(event, CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(3);
  expect(response[0]).toEqual({ username: 'user-a', email: 'a@a.com', quicksightGroups });
  expect(response[1]).toEqual({ username: 'user-b', email: 'b@b.com', quicksightGroups });
  expect(response[2]).toEqual({ username: 'user-c', email: 'c@c.com', quicksightGroups });

  expect(mockCognitoClient.calls()).toHaveLength(6);
  expect(mockQuicksightClient.calls()).toHaveLength(13);
});

test('user existence failures', async () => {
  mockCognitoClient
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .resolves(mockCognitoUser('user-a', 'a@a.com'))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .resolves(mockCognitoUser('user-c', 'c@c.com'));

  mockQuicksightClient
    .on(ListGroupsCommand)
    .resolves({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .resolves({ User: { UserName: 'user-b', Email: 'b@b.com' } })
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .resolves({ User: { UserName: 'user-c', Email: 'c@c.com' } })

    .on(ListUserGroupsCommand)
    .resolves({ GroupList: [] });

  // user a exists in cognito and not quicksight
  // user b exists in quicksight and not cognito
  // user c exists in both
  const quicksightGroups = ['group-one', 'group-two'];
  const event = {
    requests: [
      { username: 'user-a', email: 'a@a.com', quicksightGroups },
      { username: 'user-b', email: 'b@b.com', quicksightGroups },
      { username: 'user-c', email: 'c@c.com', quicksightGroups },
    ],
  };

  const response = await handler(event, CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(3);
  expect(response[0]).toEqual({
    username: 'user-a',
    email: 'a@a.com',
    quicksightGroups,
    error: 'User exists in Cognito but not in Quicksight - please resolve manually',
  });
  expect(response[1]).toEqual({
    username: 'user-b',
    email: 'b@b.com',
    quicksightGroups,
    error: 'User exists in Quicksight but not in Cognito - please resolve manually',
  });
  expect(response[2]).toEqual({
    username: 'user-c',
    email: 'c@c.com',
    quicksightGroups,
    error: 'User exists in Cognito and Quicksight - please resolve manually',
  });

  expect(mockCognitoClient.calls()).toHaveLength(3);
  expect(mockQuicksightClient.calls()).toHaveLength(7);
});

test('user status errors', async () => {
  mockCognitoClient
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejects('Cognito get user error')
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }));

  mockQuicksightClient
    .on(ListGroupsCommand)
    .resolves({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .rejects('Quicksight get user error')
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))

    .on(ListUserGroupsCommand, { UserName: 'user-a' })
    .resolves({ GroupList: [] })
    .on(ListUserGroupsCommand, { UserName: 'user-b' })
    .resolves({ GroupList: [{ GroupName: 'group-one' }] })
    .on(ListUserGroupsCommand, { UserName: 'user-c' })
    .rejects('Quicksight get groups error');

  // user a should be created and added to both groups - but there is an error getting user status from cognito
  // user b should be created and added to group-two (already in group-one) - but there is an error getting user status from quicksight
  // user c should be created and not added to any groups (already in group-one and group-two) - but there is an error getting groups from quicksight
  const quicksightGroups = ['group-one', 'group-two'];
  const event = {
    requests: [
      { username: 'user-a', email: 'a@a.com', quicksightGroups },
      { username: 'user-b', email: 'b@b.com', quicksightGroups },
      { username: 'user-c', email: 'c@c.com', quicksightGroups },
    ],
  };

  const response = await handler(event, CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(3);
  expect(response[0]).toEqual({
    username: 'user-a',
    email: 'a@a.com',
    quicksightGroups,
    error: 'Cognito get user error',
  });
  expect(response[1]).toEqual({
    username: 'user-b',
    email: 'b@b.com',
    quicksightGroups,
    error: 'Quicksight get user error',
  });
  expect(response[2]).toEqual({
    username: 'user-c',
    email: 'c@c.com',
    quicksightGroups,
    error: 'Quicksight get groups error',
  });

  expect(mockCognitoClient.calls()).toHaveLength(3);
  expect(mockQuicksightClient.calls()).toHaveLength(4);
});

test('user and group add errors', async () => {
  mockCognitoClient
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))

    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejects('Cognito add user error')
    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .resolves({})
    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .resolves({});

  mockQuicksightClient
    .on(ListGroupsCommand)
    .resolves({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))

    .on(ListUserGroupsCommand, { UserName: 'user-a' })
    .resolves({ GroupList: [] })
    .on(ListUserGroupsCommand, { UserName: 'user-b' })
    .resolves({ GroupList: [{ GroupName: 'group-one' }] })
    .on(ListUserGroupsCommand, { UserName: 'user-c' })
    .resolves({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(RegisterUserCommand, { UserName: 'user-a' })
    .resolves({})
    .on(RegisterUserCommand, { UserName: 'user-b' })
    .resolves({})
    .on(RegisterUserCommand, { UserName: 'user-c' })
    .rejects('Quicksight add user error')

    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-one' })
    .resolves({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-two' })
    .resolves({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-b', GroupName: 'group-two' })
    .rejects('Quicksight add to group error');

  // user a should be created and added to both groups - but there is an error creating the user in cognito
  // user b should be created and added to group-two (already in group-one) - but there is an error adding the user to the quicksight group
  // user c should be created and not added to any groups (already in group-one and group-two) - but there is an error creating the user in quicksight
  const quicksightGroups = ['group-one', 'group-two'];
  const event = {
    requests: [
      { username: 'user-a', email: 'a@a.com', quicksightGroups },
      { username: 'user-b', email: 'b@b.com', quicksightGroups },
      { username: 'user-c', email: 'c@c.com', quicksightGroups },
    ],
  };

  const response = await handler(event, CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(3);
  expect(response[0]).toEqual({
    username: 'user-a',
    email: 'a@a.com',
    quicksightGroups,
    error: 'Cognito add user error (Failed creating Cognito user - nothing created)',
  });
  expect(response[1]).toEqual({
    username: 'user-b',
    email: 'b@b.com',
    quicksightGroups,
    error: 'Quicksight add to group error (Failed adding user to group - Cognito and Quicksight users created)',
  });
  expect(response[2]).toEqual({
    username: 'user-c',
    email: 'c@c.com',
    quicksightGroups,
    error: 'Quicksight add user error (Failed creating Quicksight user - Cognito user created)',
  });

  expect(mockCognitoClient.calls()).toHaveLength(6);
  expect(mockQuicksightClient.calls()).toHaveLength(10);
});

test('group existence failures', async () => {
  mockCognitoClient
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))

    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .resolves({});

  mockQuicksightClient
    .on(ListGroupsCommand)
    .resolves({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))

    .on(ListUserGroupsCommand, { UserName: 'user-a' })
    .resolves({ GroupList: [] })

    .on(RegisterUserCommand, { UserName: 'user-a' })
    .resolves({})

    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-one' })
    .resolves({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-two' })
    .resolves({});

  // user a has only existing groups
  // user b has a mixture of existing and non-existent groups
  // user c has only non-existent groups
  const quicksightGroups = ['group-one', 'group-two'];
  const event = {
    requests: [
      { username: 'user-a', email: 'a@a.com', quicksightGroups },
      { username: 'user-b', email: 'b@b.com', quicksightGroups: [...quicksightGroups, 'group-three'] },
      { username: 'user-c', email: 'c@c.com', quicksightGroups: ['group-four', 'group-five'] },
    ],
  };

  const response = await handler(event, CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(3);
  expect(response[0]).toEqual({
    username: 'user-a',
    email: 'a@a.com',
    quicksightGroups,
  });
  expect(response[1]).toEqual({
    username: 'user-b',
    email: 'b@b.com',
    quicksightGroups: [...quicksightGroups, 'group-three'],
    error: 'The following groups do not exist in Quicksight [group-three] - please review the request',
  });
  expect(response[2]).toEqual({
    username: 'user-c',
    email: 'c@c.com',
    quicksightGroups: ['group-four', 'group-five'],
    error: 'The following groups do not exist in Quicksight [group-four, group-five] - please review the request',
  });

  expect(mockCognitoClient.calls()).toHaveLength(2);
  expect(mockQuicksightClient.calls()).toHaveLength(6);
});
