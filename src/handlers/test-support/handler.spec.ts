import { handler } from './handler';
import type { TestSupportCommand, TestSupportEnvironment, TestSupportEvent } from './handler';
import { mockClient } from 'aws-sdk-client-mock';
import { LambdaClient } from '@aws-sdk/client-lambda';

jest.spyOn(console, 'log').mockImplementation(() => undefined);
jest.spyOn(console, 'error').mockImplementation(() => undefined);

const mockLambdaClient = mockClient(LambdaClient);

beforeEach(() => mockLambdaClient.reset());

test('unknown environment', async () => {
  const event = getEvent({ environment: 'NotAnEnv' });
  await expect(handler(event)).rejects.toThrow('Unknown environment "NotAnEnv"');
});

test('unknown command', async () => {
  const event = getEvent({ command: 'NotACommand' });
  await expect(handler(event)).rejects.toThrow('Unknown command "NotACommand"');
});

test('missing input parameter', async () => {
  mockLambdaClient.resolves({});

  const event = getEvent({ input: { FunctionName: 'my-lambda' } });
  await expect(handler(event)).rejects.toThrow('Object is missing the following required fields: Payload');

  expect(mockLambdaClient.calls()).toHaveLength(0);
});

test('client failure', async () => {
  mockLambdaClient.rejects('Lambda error');

  const event = getEvent({ input: { FunctionName: 'my-lambda', Payload: '{}' } });
  await expect(handler(event)).rejects.toThrow('Lambda error');

  expect(mockLambdaClient.calls()).toHaveLength(1);
});

test('success', async () => {
  mockLambdaClient.resolves({});

  const event = getEvent({ input: { FunctionName: 'my-lambda', Payload: '{}' } });
  await expect(handler(event)).resolves.toBeDefined();

  expect(mockLambdaClient.calls()).toHaveLength(1);
});

const getEvent = (overrides: { environment?: string; command?: string; input?: object }): TestSupportEvent => {
  return {
    environment: (overrides.environment ?? 'dev') as TestSupportEnvironment,
    command: (overrides.command ?? 'LAMBDA_INVOKE') as TestSupportCommand,
    input: overrides.input ?? {},
  };
};
