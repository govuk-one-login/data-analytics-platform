import { mockClient } from 'aws-sdk-client-mock';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { getTestResource, mockCognitoUser } from '../../shared/utils/test-utils';
import type { sheets_v4 } from 'googleapis';
import { handler } from './handler';
import type { AddUserResult, AddUsersEvent } from '../quicksight-add-users/handler';
import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DescribeUserCommand,
  ListUserGroupsCommand,
  QuickSightClient,
  ResourceNotFoundException,
} from '@aws-sdk/client-quicksight';
import type { Context } from 'aws-lambda';
import type { LambdaInvokeResponse } from '../../shared/utils/utils';
import { encodeObject } from '../../shared/utils/utils';

const ACCOUNT_ID = '123456789012';

const CONTEXT: Context = {
  invokedFunctionArn: `arn:aws:lambda:eu-west-2:${ACCOUNT_ID}:function:LambdaFunctionName`,
} as unknown as Context;

const USER_POOL_ID = 'user-pool-id';

const mockLambdaClient = mockClient(LambdaClient);
const mockCognitoClient = mockClient(CognitoIdentityProviderClient);
const mockQuicksightClient = mockClient(QuickSightClient);

let GDS_USER_SHEET: sheets_v4.Schema$ValueRange;
let RP_USER_SHEET: sheets_v4.Schema$ValueRange;

beforeAll(async () => {
  GDS_USER_SHEET = JSON.parse(await getTestResource('user-spreadsheet-data-gds.json'));
  RP_USER_SHEET = JSON.parse(await getTestResource('user-spreadsheet-data-rp.json'));
  process.env.USER_POOL_ID = USER_POOL_ID;
});

beforeEach(() => {
  mockLambdaClient.reset();
  mockLambdaClient.on(InvokeCommand).callsFakeOnce(input => ({
    StatusCode: 200,
    ExecutedVersion: 1,
    FunctionError: undefined,
    LogResult: undefined,
    Payload: encodeObject(JSON.parse(input.Payload).requests),
  }));

  // give these clients default responses that indicate the user exists in neither service
  mockCognitoClient.reset();
  mockQuicksightClient.reset();
  mockCognitoClient
    .callsFake(input => {
      throw new Error(`Unexpected Cognito request - ${JSON.stringify(input)}`);
    })
    .on(AdminGetUserCommand)
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }));
  mockQuicksightClient
    .callsFake(input => {
      throw new Error(`Unexpected Quicksight request - ${JSON.stringify(input)}`);
    })
    .on(DescribeUserCommand)
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(ListUserGroupsCommand)
    .resolves({ GroupList: [] });
});

test('test gds users', async () => {
  const expectedEmails = [
    'user.one@digital.cabinet-office.gov.uk',
    'user.two@digital.cabinet-office.gov.uk',
    'user.three@digital.cabinet-office.gov.uk',
    'user.four@digital.cabinet-office.gov.uk',
  ];

  const payload = await getLambdaPayload(GDS_USER_SHEET);
  expect(payload).toBeDefined();
  expect(payload).toHaveLength(4);
  expect(payload.map(request => request.username)).toEqual(expect.arrayContaining(expectedEmails));
  expect(payload.map(request => request.email)).toEqual(expect.arrayContaining(expectedEmails));
  expect(
    payload.map(request => request.quicksightGroups).every(groups => groups.length === 1 && groups[0] === 'gds-users'),
  ).toBe(true);
});

test('test rp users', async () => {
  // there is a user.five in the file but only the email (second column) has been filled in so it shouldn't come through
  const expectedEmails = [
    'user.one@dbs.gov.uk',
    'user.two@dbs.gov.uk',
    'user.three@dbs.gov.uk',
    'user.four@dvsa.gov.uk',
    'user.six@dvsa.gov.uk',
  ];

  const payload = await getLambdaPayload(RP_USER_SHEET);
  expect(payload).toBeDefined();
  expect(payload).toHaveLength(5);
  expect(payload.map(request => request.username)).toEqual(expect.arrayContaining(expectedEmails));
  expect(payload.map(request => request.email)).toEqual(expect.arrayContaining(expectedEmails));
  expect(
    payload
      .slice(0, 3)
      .map(request => request.quicksightGroups)
      .every(groups => groups.length === 1 && groups[0] === 'dbs'),
  ).toBe(true);
  expect(
    payload
      .slice(3)
      .map(request => request.quicksightGroups)
      .every(groups => groups.length === 1 && groups[0] === 'dvsa'),
  ).toBe(true);
});

test('filter out users', async () => {
  // there is a user.five in the file but only the email (second column) has been filled in so it shouldn't come through
  const expectedEmails = ['user.two@dbs.gov.uk', 'user.four@dvsa.gov.uk', 'user.six@dvsa.gov.uk'];

  // cognito and quicksight responses to indicate users one and three have accounts in both which should mean they are filtered out
  // user six also has an account but only in quicksight (which will need manual resolution but should not result in the user being filtered at this stage)
  mockCognitoClient.reset();
  mockQuicksightClient.reset();
  mockCognitoClient
    .on(AdminGetUserCommand)
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user.one@dbs.gov.uk' })
    .resolvesOnce(mockCognitoUser('user.one@dbs.gov.uk', 'user.one@dbs.gov.uk'))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user.three@dbs.gov.uk' })
    .resolvesOnce(mockCognitoUser('user.three@dbs.gov.uk', 'user.three@dbs.gov.uk'));

  mockQuicksightClient
    .on(DescribeUserCommand)
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user.one@dbs.gov.uk' })
    .resolvesOnce({ User: { UserName: 'user.one@dbs.gov.uk', Email: 'user.one@dbs.gov.uk' } })
    .on(DescribeUserCommand, { UserName: 'user.three@dbs.gov.uk' })
    .resolvesOnce({ User: { UserName: 'user.three@dbs.gov.uk', Email: 'user.three@dbs.gov.uk' } })
    .on(DescribeUserCommand, { UserName: 'user.six@dvsa.gov.uk' })
    .resolvesOnce({ User: { UserName: 'user.six@dvsa.gov.uk', Email: 'user.six@dvsa.gov.uk' } })
    .on(ListUserGroupsCommand)
    .resolves({ GroupList: [] });

  const payload = await getLambdaPayload(RP_USER_SHEET);
  expect(payload).toBeDefined();
  expect(payload).toHaveLength(3);
  expect(payload.map(request => request.username)).toEqual(expect.arrayContaining(expectedEmails));
  expect(payload.map(request => request.email)).toEqual(expect.arrayContaining(expectedEmails));
});

test('dry run', async () => {
  const expectedEmails = [
    'user.two@digital.cabinet-office.gov.uk',
    'user.three@digital.cabinet-office.gov.uk',
    'user.four@digital.cabinet-office.gov.uk',
  ];

  // cognito and quicksight responses to indicate user one has an account in both which should mean they are filtered out
  // user three also has an account but only in cognito (which will need manual resolution but should not result in the user being filtered at this stage)
  mockCognitoClient.reset();
  mockQuicksightClient.reset();
  mockCognitoClient
    .on(AdminGetUserCommand)
    .rejects(new UserNotFoundException({ message: '', $metadata: {} }))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user.one@digital.cabinet-office.gov.uk' })
    .resolvesOnce(mockCognitoUser('user.one@digital.cabinet-office.gov.uk', 'user.one@digital.cabinet-office.gov.uk'))
    .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: 'user.three@digital.cabinet-office.gov.uk' })
    .resolvesOnce(
      mockCognitoUser('user.three@digital.cabinet-office.gov.uk', 'user.three@digital.cabinet-office.gov.uk'),
    );

  mockQuicksightClient
    .on(DescribeUserCommand)
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(DescribeUserCommand, { UserName: 'user.one@digital.cabinet-office.gov.uk' })
    .resolvesOnce({
      User: { UserName: 'user.one@digital.cabinet-office.gov.uk', Email: 'user.one@digital.cabinet-office.gov.uk' },
    })
    .on(ListUserGroupsCommand)
    .resolves({ GroupList: [] });

  const payload = (await handler({ spreadsheet: GDS_USER_SHEET, dryRun: true }, CONTEXT)) as AddUsersEvent;
  expect(payload).toBeDefined();
  expect(payload.requests).toHaveLength(3);
  expect(payload.requests.map(request => request.username)).toEqual(expect.arrayContaining(expectedEmails));
  expect(payload.requests.map(request => request.email)).toEqual(expect.arrayContaining(expectedEmails));

  expect(mockLambdaClient.calls()).toHaveLength(0);
});

test('user status batching', async () => {
  const users = Array(100)
    .fill(0)
    .map(i => ({ Email: `${Math.random().toString(36).substring(2)}@example.com` }));

  // set up cognito and quicksight responses indicating every other user has an account in both which should mean they are filtered out
  mockCognitoClient.reset();
  mockQuicksightClient.reset();
  mockCognitoClient.on(AdminGetUserCommand).rejects(new UserNotFoundException({ message: '', $metadata: {} }));

  mockQuicksightClient
    .on(DescribeUserCommand)
    .rejects(new ResourceNotFoundException({ message: '', $metadata: {} }))
    .on(ListUserGroupsCommand)
    .resolves({ GroupList: [] });

  const expectedEmails: string[] = [];
  users.forEach((user, index) => {
    if (index % 2 === 0) {
      mockCognitoClient
        .on(AdminGetUserCommand, { UserPoolId: USER_POOL_ID, Username: user.Email })
        .resolvesOnce(mockCognitoUser(user.Email, user.Email));
      mockQuicksightClient
        .on(DescribeUserCommand, { UserName: user.Email })
        .resolvesOnce({ User: { UserName: user.Email, Email: user.Email } });
    } else {
      expectedEmails.push(user.Email);
    }
  });

  const sheet: sheets_v4.Schema$ValueRange = {
    range: "'Internal Quicksight reader accounts'!A1:C996",
    majorDimension: 'ROWS',
    values: [['Name', 'Email', 'Type'], ...users.map(user => [user.Email, user.Email, 'Reader'])],
  };

  expect(sheet.values).toBeDefined();
  expect(sheet.values).toHaveLength(101);

  const payload = await getLambdaPayload(sheet);
  expect(payload).toBeDefined();
  expect(payload).toHaveLength(50);
  expect(payload.map(request => request.username)).toEqual(expect.arrayContaining(expectedEmails));
  expect(payload.map(request => request.email)).toEqual(expect.arrayContaining(expectedEmails));
});

const getLambdaPayload = async (range: sheets_v4.Schema$ValueRange): Promise<AddUserResult[]> => {
  const lambdaInput = await handler({ spreadsheet: range }, CONTEXT);
  expect(lambdaInput).toBeDefined();
  const payload = (lambdaInput as LambdaInvokeResponse).payload as AddUserResult[];
  expect(payload).toBeDefined();
  return payload;
};
