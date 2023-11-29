import { handler } from './handler';
import type { Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import type { AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CreateGroupMembershipCommand,
  DescribeUserCommand,
  ListUserGroupsCommand,
  QuickSightClient,
  RegisterUserCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-quicksight';

const ACCOUNT_ID = '123456789012';

const CONTEXT: Context = {
  invokedFunctionArn: `arn:aws:lambda:eu-west-2:${ACCOUNT_ID}:function:LambdaFunctionName`,
} as unknown as Context;

const USER_POOL_ID = 'user-pool-id';

const mockCognitoClient = mockClient(CognitoIdentityProviderClient);
const mockQuicksightClient = mockClient(QuickSightClient);

beforeEach(() => {
  mockCognitoClient.reset();
  mockQuicksightClient.reset();
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

test('successes', async () => {
  mockCognitoClient
    .callsFake(input => {
      throw new Error(`Unexpected Cognito request - ${JSON.stringify(input)}`);
    })

    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))

    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .resolvesOnce({})
    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .resolvesOnce({})
    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .resolvesOnce({});

  mockQuicksightClient
    .callsFake(input => {
      throw new Error(`Unexpected Quicksight request - ${JSON.stringify(input)}`);
    })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))

    .on(ListUserGroupsCommand, { UserName: 'user-a' })
    .resolvesOnce({ GroupList: [] })
    .on(ListUserGroupsCommand, { UserName: 'user-b' })
    .resolvesOnce({ GroupList: [{ GroupName: 'group-one' }] })
    .on(ListUserGroupsCommand, { UserName: 'user-c' })
    .resolvesOnce({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(RegisterUserCommand, { UserName: 'user-a' })
    .resolvesOnce({})
    .on(RegisterUserCommand, { UserName: 'user-b' })
    .resolvesOnce({})
    .on(RegisterUserCommand, { UserName: 'user-c' })
    .resolvesOnce({})

    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-one' })
    .resolvesOnce({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-two' })
    .resolvesOnce({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-b', GroupName: 'group-two' })
    .resolvesOnce({});

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
  expect(mockQuicksightClient.calls()).toHaveLength(12);
});

test('user existence failures', async () => {
  mockCognitoClient
    .callsFake(input => {
      throw new Error(`Unexpected Cognito request - ${JSON.stringify(input)}`);
    })

    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .resolvesOnce(cognitoUser('user-a', 'a@a.com'))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .resolvesOnce(cognitoUser('user-c', 'c@c.com'));

  mockQuicksightClient
    .callsFake(input => {
      throw new Error(`Unexpected Quicksight request - ${JSON.stringify(input)}`);
    })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .resolvesOnce({ User: { UserName: 'user-b', Email: 'b@b.com' } })
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .resolvesOnce({ User: { UserName: 'user-c', Email: 'c@c.com' } })

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
  expect(mockQuicksightClient.calls()).toHaveLength(6);
});

test('user status errors', async () => {
  mockCognitoClient
    .callsFake(input => {
      throw new Error(`Unexpected Cognito request - ${JSON.stringify(input)}`);
    })

    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejectsOnce('Cognito get user error')
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }));

  mockQuicksightClient
    .callsFake(input => {
      throw new Error(`Unexpected Quicksight request - ${JSON.stringify(input)}`);
    })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .rejectsOnce('Quicksight get user error')
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))

    .on(ListUserGroupsCommand, { UserName: 'user-a' })
    .resolvesOnce({ GroupList: [] })
    .on(ListUserGroupsCommand, { UserName: 'user-b' })
    .resolvesOnce({ GroupList: [{ GroupName: 'group-one' }] })
    .on(ListUserGroupsCommand, { UserName: 'user-c' })
    .rejectsOnce('Quicksight get groups error');

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
  expect(mockQuicksightClient.calls()).toHaveLength(3);
});

test('user and group add errors', async () => {
  mockCognitoClient
    .callsFake(input => {
      throw new Error(`Unexpected Cognito request - ${JSON.stringify(input)}`);
    })

    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))

    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-a' })
    .rejectsOnce('Cognito add user error')
    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-b' })
    .resolvesOnce({})
    .on(AdminCreateUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user-c' })
    .resolvesOnce({});

  mockQuicksightClient
    .callsFake(input => {
      throw new Error(`Unexpected Quicksight request - ${JSON.stringify(input)}`);
    })

    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))

    .on(ListUserGroupsCommand, { UserName: 'user-a' })
    .resolvesOnce({ GroupList: [] })
    .on(ListUserGroupsCommand, { UserName: 'user-b' })
    .resolvesOnce({ GroupList: [{ GroupName: 'group-one' }] })
    .on(ListUserGroupsCommand, { UserName: 'user-c' })
    .resolvesOnce({ GroupList: [{ GroupName: 'group-one' }, { GroupName: 'group-two' }] })

    .on(RegisterUserCommand, { UserName: 'user-a' })
    .resolvesOnce({})
    .on(RegisterUserCommand, { UserName: 'user-b' })
    .resolvesOnce({})
    .on(RegisterUserCommand, { UserName: 'user-c' })
    .rejectsOnce('Quicksight add user error')

    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-one' })
    .resolvesOnce({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-a', GroupName: 'group-two' })
    .resolvesOnce({})
    .on(CreateGroupMembershipCommand, { MemberName: 'user-b', GroupName: 'group-two' })
    .rejectsOnce('Quicksight add to group error');

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
  expect(mockQuicksightClient.calls()).toHaveLength(9);
});

const cognitoUser = (username: string, email: string): { Username: string; UserAttributes: AttributeType[] } => {
  return { Username: username, UserAttributes: [{ Name: 'email', Value: email }] };
};
