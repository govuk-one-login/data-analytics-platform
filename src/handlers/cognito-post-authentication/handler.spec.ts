import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { mockClient } from 'aws-sdk-client-mock';
import { PostAuthenticationTriggerEvent } from 'aws-lambda';
import { handler, logger } from './handler';

const mockCognitoClient = mockClient(CognitoIdentityProviderClient);

const TEST_EMAIL = 'test-user@digital.cabinet-office.gov.uk';

const TEST_EVENT: PostAuthenticationTriggerEvent = {
  version: '1',
  region: 'eu-west-2',
  userPoolId: 'eu-west-2_123456789',
  userName: TEST_EMAIL,
  callerContext: {
    awsSdkVersion: 'aws-sdk-unknown-unknown',
    clientId: 'client-id',
  },
  triggerSource: 'PostAuthentication_Authentication',
  request: {
    userAttributes: {
      sub: 'd513ab86-3e92-415b-8779-a64c7f722540',
      email_verified: 'true',
      'cognito:user_status': 'CONFIRMED',
      email: TEST_EMAIL,
    },
    newDeviceUsed: false,
  },
  response: {},
};

const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

beforeEach(async () => {
  loggerErrorSpy.mockReset();
  mockCognitoClient.reset();
  mockCognitoClient.callsFake(input => {
    throw new Error(`Unexpected Cognito request - ${JSON.stringify(input)}`);
  });
});

test('success', async () => {
  const now = Date.now();
  jest.useFakeTimers().setSystemTime(now);
  mockCognitoClient
    .on(AdminUpdateUserAttributesCommand, { UserAttributes: [{ Name: 'custom:last_login', Value: now.toString() }] })
    .resolvesOnce({});

  const event = await handler(TEST_EVENT);
  expect(event).toEqual(TEST_EVENT);

  expect(mockCognitoClient.calls()).toHaveLength(1);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
});

test('event error', async () => {
  const expectedError = 'Object is missing the following required fields: userPoolId';

  await handler({ ...TEST_EVENT, userPoolId: undefined } as unknown as PostAuthenticationTriggerEvent);

  expect(mockCognitoClient.calls()).toHaveLength(0);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Error in post authentication lambda', {
    error: new Error(expectedError),
  });
});

test('cognito error', async () => {
  const error = 'cognito error';
  mockCognitoClient.on(AdminUpdateUserAttributesCommand).rejectsOnce(error);

  const event = await handler(TEST_EVENT);
  expect(event).toEqual(TEST_EVENT);

  expect(mockCognitoClient.calls()).toHaveLength(1);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
  expect(loggerErrorSpy).toHaveBeenCalledWith('Error in post authentication lambda', { error: new Error(error) });
});
