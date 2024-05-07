import { mockClient } from 'aws-sdk-client-mock';
import { DescribeExecutionCommand, ListExecutionsCommand, SFNClient } from '@aws-sdk/client-sfn';
import type { ExecutionListItem, ExecutionStatus } from '@aws-sdk/client-sfn';
import { handler } from './handler';

const mockSFNClient = mockClient(SFNClient);

const EXECUTION_ARN =
  'arn:aws:states:eu-west-2:123456789012:execution:state-machine:88b36f26-bc23-4525-8749-857f9646ca4d';

const MESSAGE_GROUP_ID = 'benefits_data_government_services';

const STATE_MACHINE_ARN = 'arn:aws:states:eu-west-2:123456789012:stateMachine:state-machine';

const TEST_EVENT = {
  currentExecutionArn: EXECUTION_ARN,
  messageGroupId: MESSAGE_GROUP_ID,
};

beforeEach(() => {
  mockSFNClient.reset();
  mockSFNClient.callsFake(input => {
    throw new Error(`Unexpected SFN request - ${JSON.stringify(input)}`);
  });

  process.env.STATE_MACHINE_ARN = STATE_MACHINE_ARN;
});

test('missing state machine arn', async () => {
  process.env.STATE_MACHINE_ARN = '';

  await expect(handler(TEST_EVENT)).rejects.toThrow('STATE_MACHINE_ARN is not defined in this environment');

  expect(mockSFNClient.calls()).toHaveLength(0);
});

test('no executions', async () => {
  mockSetup();

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'true' });

  // one for the execution list
  expect(mockSFNClient.calls()).toHaveLength(1);
});

test('old execution with same id', async () => {
  mockSetup({ running: false, sameId: true });

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'true' });

  // one for the execution list
  expect(mockSFNClient.calls()).toHaveLength(1);
});

test('running execution not with same id', async () => {
  mockSetup({ running: true, sameId: false }, { running: false, sameId: false });

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'true' });

  // one for the execution list and one for the description of the running execution
  expect(mockSFNClient.calls()).toHaveLength(2);
});

test('running execution with same id', async () => {
  mockSetup({ running: true, sameId: true }, { running: false, sameId: false });

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'false' });

  // one for the execution list and one for the description of the running execution
  expect(mockSFNClient.calls()).toHaveLength(2);
});

test('multiple running executions with same id', async () => {
  mockSetup(
    { running: true, sameId: true },
    { running: false, sameId: false },
    { running: true, sameId: false },
    { running: true, sameId: true },
  );

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'false' });

  // one for the execution list and three for the description of the running executions
  expect(mockSFNClient.calls()).toHaveLength(4);
});

test('sfn client error', async () => {
  const errorMessage = 'sfn error';
  mockSFNClient.on(ListExecutionsCommand).rejects(errorMessage);

  await expect(handler(TEST_EVENT)).rejects.toThrow(errorMessage);

  expect(mockSFNClient.calls()).toHaveLength(1);
});

const mockSetup = (...extraExecutions: { running: boolean; sameId: boolean }[]) => {
  const executions = [executionListItem()].concat(
    extraExecutions.map((e, i) => executionListItem(`arn:${i}`, e.running ? 'RUNNING' : 'SUCCEEDED')),
  );
  mockSFNClient.on(ListExecutionsCommand, { stateMachineArn: STATE_MACHINE_ARN }).resolvesOnce({ executions });

  const descriptions = extraExecutions.map((e, i) => ({
    stateMachineArn: STATE_MACHINE_ARN,
    executionArn: `arn:${i}`,
    input: e.sameId ? executionInput() : executionInput(`extra-${i}`),
  }));
  descriptions.forEach(description =>
    mockSFNClient.on(DescribeExecutionCommand, { executionArn: description.executionArn }).resolvesOnce(description),
  );
};

const executionListItem = (executionArn = EXECUTION_ARN, status: ExecutionStatus = 'SUCCEEDED'): ExecutionListItem => {
  return {
    stateMachineArn: STATE_MACHINE_ARN,
    executionArn: executionArn,
    status,
  } as unknown as ExecutionListItem;
};

const executionInput = (messageGroupId = MESSAGE_GROUP_ID): string => {
  return JSON.stringify([
    {
      messageId: 'id',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1711111584399',
        SequenceNumber: '18204784639205694620',
        MessageGroupId: messageGroupId,
        SenderId: 'KJSYTFJSMD2JPQMNS4NCV:s3-send-metadata',
        MessageDeduplicationId: `${messageGroupId}_2024-03-22_12-46-17`,
        ApproximateFirstReceiveTimestamp: '1711111584399',
      },
    },
  ]);
};
