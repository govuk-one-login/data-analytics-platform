import { handler, getUsersFromDiff } from './handler';
import type { SyncEvent, SyncUser } from './handler';
import type { Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import type { AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import {
  DeleteUserCommand,
  DescribeUserCommand,
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
  await expect(handler(getEvent(), { ...CONTEXT, invokedFunctionArn: '' })).rejects.toThrow(
    'Error extracting account id from lambda ARN',
  );
});

test('missing user pool id', async () => {
  process.env.USER_POOL_ID = '';
  await expect(handler(getEvent(), CONTEXT)).rejects.toThrow('USER_POOL_ID is not defined in this environment');
});

test('get users from diff', async () => {
  testGetUsersFromDiff('', []);
  testGetUsersFromDiff(
    `\ndiff --git a/user-list.txt b/user-list.txt\nindex e184bab..1f2e647 100644\n--- a/user-list.txt\n+++ b/user-list.txt\n@@ -1,6 +1,6 @@\n`,
    [],
  );

  testGetUsersFromDiff(
    `\ndiff --git a/user-list.txt b/user-list.txt\nindex e184bab..1f2e647 100644\n--- a/user-list.txt\n+++ b/user-list.txt\n@@ -1,6 +1,6 @@\n+user-a,a@a.com,\n+user-b,b@b.com,\n+user-c,c@c.com,\n`,
    [
      { username: 'user-a', email: 'a@a.com', action: 'ADD' },
      { username: 'user-b', email: 'b@b.com', action: 'ADD' },
      { username: 'user-c', email: 'c@c.com', action: 'ADD' },
    ],
  );

  testGetUsersFromDiff(
    `\ndiff --git a/user-list.txt b/user-list.txt\nindex e184bab..1f2e647 100644\n--- a/user-list.txt\n+++ b/user-list.txt\n@@ -1,6 +1,6 @@\nuser-a,a@a.com,\nuser-b,b@b.com,\n-user-c,c@c.com,\n+user-d,d@d.com,\n`,
    [
      { username: 'user-c', email: 'c@c.com', action: 'REMOVE' },
      { username: 'user-d', email: 'd@d.com', action: 'ADD' },
    ],
  );

  testGetUsersFromDiff(
    `\ndiff --git a/user-list.txt b/user-list.txt\nindex e184bab..1f2e647 100644\n--- a/user-list.txt\n+++ b/user-list.txt\n@@ -1,6 +1,6 @@\n+user-a,a@a.com,\n user-b,b@b.com,\n`,
    [{ username: 'user-a', email: 'a@a.com', action: 'ADD' }],
  );

  testGetUsersFromDiff(
    `\ndiff --git a/user-list.txt b/user-list.txt\nindex e184bab..1f2e647 100644\n--- a/user-list.txt\n+++ b/user-list.txt\n@@ -1,6 +1,6 @@\n+user-a,a@a.com,\n++user-b,b@b.com,\n`,
    [{ username: 'user-a', email: 'a@a.com', action: 'ADD' }],
  );

  testGetUsersFromDiff(
    `\ndiff --git a/user-list.txt b/user-list.txt\nindex e184bab..1f2e647 100644\n--- a/user-list.txt\n+++ b/user-list.txt\n@@ -1,6 +1,6 @@\n+user-a,a@a.com,\n+ user-b, b@b.com,\n+user-c ,c@c.com ,\n`,
    [
      { username: 'user-a', email: 'a@a.com', action: 'ADD' },
      { username: 'user-b', email: 'b@b.com', action: 'ADD' },
      { username: 'user-c', email: 'c@c.com', action: 'ADD' },
    ],
  );
});

const testGetUsersFromDiff = (diff: string, expectedSyncs: SyncUser[]): void => {
  const response = getUsersFromDiff({ diff });
  expect(response).toHaveLength(expectedSyncs.length);
  expect(response).toEqual(expect.arrayContaining(expectedSyncs));
};

test('add user', async () => {
  const username = 'test-user';
  const email = 'someone@gmail.com';

  mockCognitoClient
    .on(AdminGetUserCommand, { Username: username, UserPoolId: USER_POOL_ID })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminCreateUserCommand, {
      Username: username,
      UserPoolId: USER_POOL_ID,
      UserAttributes: [{ Name: 'email', Value: email }],
    })
    .resolvesOnce({})
    .rejects();

  mockQuicksightClient
    .on(DescribeUserCommand, { UserName: username, AwsAccountId: ACCOUNT_ID })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(RegisterUserCommand, { UserName: username, Email: email, AwsAccountId: ACCOUNT_ID })
    .resolvesOnce({})
    .rejects();

  const response = await handler(getEvent([{ username, email, add: true }]), CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(1);
  expect(response[0].user).toEqual({ username, email, action: 'ADD' });
  expect(response[0].error).toBeUndefined();

  expect(mockCognitoClient.calls()).toHaveLength(2);
  expect(mockQuicksightClient.calls()).toHaveLength(2);
});

test('remove user', async () => {
  const username = 'test-user';
  const email = 'someone@gmail.com';

  mockCognitoClient
    .on(AdminGetUserCommand, { Username: username, UserPoolId: USER_POOL_ID })
    .resolvesOnce({ Username: username, UserAttributes: [{ Name: 'email', Value: email }] })
    .on(AdminDeleteUserCommand, { Username: username, UserPoolId: USER_POOL_ID })
    .resolvesOnce({})
    .rejects();

  mockQuicksightClient
    .on(DescribeUserCommand, { UserName: username, AwsAccountId: ACCOUNT_ID })
    .resolvesOnce({ User: { UserName: username, Email: email } })
    .on(DeleteUserCommand, { UserName: username, AwsAccountId: ACCOUNT_ID })
    .resolvesOnce({})
    .rejects();

  const response = await handler(getEvent([{ username, email, add: false }]), CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(1);
  expect(response[0].user).toEqual({ username, email, action: 'REMOVE' });
  expect(response[0].error).toBeUndefined();

  expect(mockCognitoClient.calls()).toHaveLength(2);
  expect(mockQuicksightClient.calls()).toHaveLength(2);
});

test('error in sync', async () => {
  const username = 'test-user';
  const email = 'someone@gmail.com';

  mockCognitoClient
    .on(AdminGetUserCommand, { Username: username, UserPoolId: USER_POOL_ID })
    .resolvesOnce({ Username: username, UserAttributes: [{ Name: 'email', Value: email }] })
    .on(AdminDeleteUserCommand, { Username: username, UserPoolId: USER_POOL_ID })
    .rejectsOnce({ message: 'Cognito delete user error' })
    .rejects();

  mockQuicksightClient
    .on(DescribeUserCommand, { UserName: username, AwsAccountId: ACCOUNT_ID })
    .resolvesOnce({ User: { UserName: username, Email: email } })
    .on(DeleteUserCommand, { UserName: username, AwsAccountId: ACCOUNT_ID })
    .resolvesOnce({})
    .rejects();

  const response = await handler(getEvent([{ username, email, add: false }]), CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(1);
  expect(response[0].user).toEqual({ username, email, action: 'REMOVE' });
  expect(response[0].error).toEqual('Cognito delete user error');

  expect(mockCognitoClient.calls()).toHaveLength(2);
  expect(mockQuicksightClient.calls()).toHaveLength(1);
});

test('user exists in only one place', async () => {
  const username = 'test-user';
  const email = 'someone@gmail.com';

  mockCognitoClient
    .on(AdminGetUserCommand, { Username: username, UserPoolId: USER_POOL_ID })
    .resolvesOnce({ Username: username, UserAttributes: [{ Name: 'email', Value: email }] })
    .rejects();

  mockQuicksightClient
    .on(DescribeUserCommand, { UserName: username, AwsAccountId: ACCOUNT_ID })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .rejects();

  const response = await handler(getEvent([{ username, email, add: true }]), CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(1);
  expect(response[0].user).toEqual({ username, email, action: 'ADD' });
  expect(response[0].error).toEqual('User exists in Cognito but not in Quicksight - please resolve manually');

  expect(mockCognitoClient.calls()).toHaveLength(1);
  expect(mockQuicksightClient.calls()).toHaveLength(1);
});

test('add requested but user already exists in both', async () => {
  const username = 'test-user';
  const email = 'someone@gmail.com';

  mockCognitoClient
    .on(AdminGetUserCommand, { Username: username, UserPoolId: USER_POOL_ID })
    .resolvesOnce({ Username: username, UserAttributes: [{ Name: 'email', Value: email }] })
    .rejects();

  mockQuicksightClient
    .on(DescribeUserCommand, { UserName: username, AwsAccountId: ACCOUNT_ID })
    .resolvesOnce({ User: { UserName: username, Email: email } })
    .rejects();

  const response = await handler(getEvent([{ username, email, add: true }]), CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(1);
  expect(response[0].user).toEqual({ username, email, action: 'ADD' });
  expect(response[0].error).toEqual('User to ADD already exists in Cognito and Quicksight');

  expect(mockCognitoClient.calls()).toHaveLength(1);
  expect(mockQuicksightClient.calls()).toHaveLength(1);
});

test('remove requested but user does not exist in either', async () => {
  const username = 'test-user';
  const email = 'someone@gmail.com';

  mockCognitoClient
    .on(AdminGetUserCommand, { Username: username, UserPoolId: USER_POOL_ID })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .rejects();

  mockQuicksightClient
    .on(DescribeUserCommand, { UserName: username, AwsAccountId: ACCOUNT_ID })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .rejects();

  const response = await handler(getEvent([{ username, email, add: false }]), CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(1);
  expect(response[0].user).toEqual({ username, email, action: 'REMOVE' });
  expect(response[0].error).toEqual('User to REMOVE does not exist in Cognito or Quicksight');

  expect(mockCognitoClient.calls()).toHaveLength(1);
  expect(mockQuicksightClient.calls()).toHaveLength(1);
});

test('multiple users', async () => {
  mockCognitoClient
    .on(AdminGetUserCommand, { Username: 'user-a' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { Username: 'user-b' })
    .resolvesOnce(cognitoUser('user-b', 'b@b.com'))
    .on(AdminGetUserCommand, { Username: 'user-c' })
    .resolvesOnce(cognitoUser('user-c', 'c@c.com'))
    .on(AdminGetUserCommand, { Username: 'user-d' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { Username: 'user-e' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { Username: 'user-f' })
    .resolvesOnce(cognitoUser('user-f', 'f@f.com'))
    .on(AdminGetUserCommand, { Username: 'user-g' })
    .rejectsOnce(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminCreateUserCommand, { Username: 'user-a' })
    .resolvesOnce({})
    .on(AdminDeleteUserCommand, { Username: 'user-b' })
    .resolvesOnce({})
    .on(AdminCreateUserCommand, { Username: 'user-e' })
    .resolvesOnce({})
    .rejects();

  mockQuicksightClient
    .on(DescribeUserCommand, { UserName: 'user-a' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-b' })
    .resolvesOnce({ User: { UserName: 'user-b', Email: 'b@b.com' } })
    .on(DescribeUserCommand, { UserName: 'user-c' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-d' })
    .resolvesOnce({ User: { UserName: 'user-d', Email: 'd@d.com' } })
    .on(DescribeUserCommand, { UserName: 'user-e' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user-f' })
    .resolvesOnce({ User: { UserName: 'user-f', Email: 'f@f.com' } })
    .on(DescribeUserCommand, { UserName: 'user-g' })
    .rejectsOnce(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(RegisterUserCommand, { UserName: 'user-a' })
    .resolvesOnce({})
    .on(DeleteUserCommand, { UserName: 'user-b', AwsAccountId: ACCOUNT_ID })
    .resolvesOnce({})
    .on(RegisterUserCommand, { UserName: 'user-e', AwsAccountId: ACCOUNT_ID })
    .resolvesOnce({})
    .resolvesOnce({})
    .rejects();

  // user a should be added
  // user b should be removed
  // user c exists in cognito but not quicksight
  // user d exists in quicksight but not cognito
  // user e should be added
  // user f should be added but already exists
  // user g should be removed but does not exist
  const event = getEvent([
    { username: 'user-a', email: 'a@a.com', add: true },
    { username: 'user-b', email: 'b@b.com', add: false },
    { username: 'user-c', email: 'c@c.com', add: true },
    { username: 'user-d', email: 'd@d.com', add: true },
    { username: 'user-e', email: 'e@e.com', add: true },
    { username: 'user-f', email: 'f@f.com', add: true },
    { username: 'user-g', email: 'g@g.com', add: false },
  ]);

  const response = await handler(event, CONTEXT);
  expect(response).toBeDefined();
  expect(response).toHaveLength(7);
  expect(response[0]).toEqual({ user: { username: 'user-a', email: 'a@a.com', action: 'ADD' } });
  expect(response[1]).toEqual({ user: { username: 'user-b', email: 'b@b.com', action: 'REMOVE' } });
  expect(response[2]).toEqual({
    user: { username: 'user-c', email: 'c@c.com', action: 'ADD' },
    error: 'User exists in Cognito but not in Quicksight - please resolve manually',
  });
  expect(response[3]).toEqual({
    user: { username: 'user-d', email: 'd@d.com', action: 'ADD' },
    error: 'User exists in Quicksight but not in Cognito - please resolve manually',
  });
  expect(response[4]).toEqual({ user: { username: 'user-e', email: 'e@e.com', action: 'ADD' } });
  expect(response[5]).toEqual({
    user: { username: 'user-f', email: 'f@f.com', action: 'ADD' },
    error: 'User to ADD already exists in Cognito and Quicksight',
  });
  expect(response[6]).toEqual({
    user: { username: 'user-g', email: 'g@g.com', action: 'REMOVE' },
    error: 'User to REMOVE does not exist in Cognito or Quicksight',
  });

  expect(mockCognitoClient.calls()).toHaveLength(10);
  expect(mockQuicksightClient.calls()).toHaveLength(10);
});

const cognitoUser = (username: string, email: string): { Username: string; UserAttributes: AttributeType[] } => {
  return { Username: username, UserAttributes: [{ Name: 'email', Value: email }] };
};

const getEvent = (users?: Array<{ username: string; email: string; add: boolean }>): SyncEvent => {
  return {
    diff: `
diff --git a/user-list.txt b/user-list.txt
index e184bab..1f2e647 100644
--- a/user-list.txt
+++ b/user-list.txt
@@ -1,6 +1,6 @@
${users?.map(u => `${u.add ? '+' : '-'}${u.username},${u.email}`).join(`\n`)}`,
  };
};
