import { mockClient } from 'aws-sdk-client-mock';
import { DescribeExecutionCommand, ListExecutionsCommand, SFNClient } from '@aws-sdk/client-sfn';
import type { ExecutionListItem, ExecutionStatus } from '@aws-sdk/client-sfn';
import { handler, logger } from './handler';

const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

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
  loggerSpy.mockReset();

  mockSFNClient.reset();
  mockSFNClient.callsFake(input => {
    throw new Error(`Unexpected SFN request - ${JSON.stringify(input)}`);
  });

  process.env.STATE_MACHINE_ARN = STATE_MACHINE_ARN;
});

test('missing state machine arn', async () => {
  process.env.STATE_MACHINE_ARN = '';

  const expectedErrorMessage = 'STATE_MACHINE_ARN is not defined in this environment';

  await expect(handler(TEST_EVENT)).rejects.toThrow(expectedErrorMessage);

  expect(loggerSpy).toHaveBeenCalledTimes(1);
  expect(loggerSpy).toHaveBeenCalledWith('Error validating stepfunction execution', {
    error: new Error(expectedErrorMessage),
  });

  expect(mockSFNClient.calls()).toHaveLength(0);
});

test('no executions', async () => {
  mockSetup(new MockExecution({ executionArn: EXECUTION_ARN }));

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'true' });

  expect(loggerSpy).toHaveBeenCalledTimes(0);

  // one for the execution list and one for the description of the running execution
  expect(mockSFNClient.calls()).toHaveLength(2);
});

test('old execution with same id', async () => {
  mockSetup(new MockExecution({ executionArn: EXECUTION_ARN }), new MockExecution({ status: 'SUCCEEDED' }));

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'true' });

  expect(loggerSpy).toHaveBeenCalledTimes(0);

  // one for the execution list and one for the description of the running execution
  expect(mockSFNClient.calls()).toHaveLength(2);
});

test('running execution not with same id', async () => {
  mockSetup(new MockExecution({ executionArn: EXECUTION_ARN }), new MockExecution({ messageGroupId: 'another id' }));

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'true' });

  expect(loggerSpy).toHaveBeenCalledTimes(0);

  // one for the execution list, one for the description of the running execution and one for the description of the other execution
  expect(mockSFNClient.calls()).toHaveLength(3);
});

test('running execution with same id started before', async () => {
  mockSetup(
    new MockExecution({ executionArn: EXECUTION_ARN, startDate: new Date(1715177635433) }),
    new MockExecution({ startDate: new Date(1715177635400) }),
  );

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'false' });

  expect(loggerSpy).toHaveBeenCalledTimes(1);
  expect(loggerSpy.mock.calls[0][0]).toEqual(
    'One or more other executions found with the same MessageGroupId that started before this one',
  );
  expect(getStartedBeforeWithSameId()).toHaveLength(1);

  // one for the execution list, one for the description of the running execution and one for the description of the other execution
  expect(mockSFNClient.calls()).toHaveLength(3);
});

test('running execution with same id started after', async () => {
  mockSetup(
    new MockExecution({ executionArn: EXECUTION_ARN, startDate: new Date(1715177635400) }),
    new MockExecution({ startDate: new Date(1715177635433) }),
  );

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'true' });

  expect(loggerSpy).toHaveBeenCalledTimes(0);

  // one for the execution list, one for the description of the running execution and one for the description of the other execution
  expect(mockSFNClient.calls()).toHaveLength(3);
});

test('multiple with same id and some before', async () => {
  mockSetup(
    new MockExecution({ executionArn: EXECUTION_ARN, startDate: new Date(1715177635433) }),
    new MockExecution({ startDate: new Date(1715177635400) }), // started before with same id
    new MockExecution({ startDate: new Date(1715177635420) }), // started before with same id
    new MockExecution({ startDate: new Date(1715177635400), messageGroupId: 'another id' }), // started before with different id
  );

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'false' });

  expect(loggerSpy).toHaveBeenCalledTimes(1);
  expect(loggerSpy.mock.calls[0][0]).toEqual(
    'One or more other executions found with the same MessageGroupId that started before this one',
  );
  expect(getStartedBeforeWithSameId()).toHaveLength(2);

  // one for the execution list and four for the description of the running executions
  expect(mockSFNClient.calls()).toHaveLength(5);
});

test('multiple with same id and none before', async () => {
  mockSetup(
    new MockExecution({ executionArn: EXECUTION_ARN, startDate: new Date(1715177635433) }),
    new MockExecution({ startDate: new Date(1715177635440) }),
    new MockExecution({ startDate: new Date(1715177635460) }),
    new MockExecution({ startDate: new Date(1715177635400), messageGroupId: 'another id' }), // started before with different id
  );

  const response = await handler(TEST_EVENT);
  expect(response).toEqual({ continue: 'true' });

  expect(loggerSpy).toHaveBeenCalledTimes(0);

  // one for the execution list and four for the description of the running executions
  expect(mockSFNClient.calls()).toHaveLength(5);
});

test('sfn client error', async () => {
  const errorMessage = 'sfn error';
  mockSFNClient.on(ListExecutionsCommand).rejects(errorMessage);

  await expect(handler(TEST_EVENT)).rejects.toThrow(errorMessage);

  expect(loggerSpy).toHaveBeenCalledTimes(1);
  expect(loggerSpy).toHaveBeenCalledWith('Error validating stepfunction execution', {
    error: new Error(errorMessage),
  });

  // one for the execution list
  expect(mockSFNClient.calls()).toHaveLength(1);
});

class MockExecution {
  stateMachineArn: string;
  executionArn: string;
  messageGroupId: string;
  status: ExecutionStatus;
  startDate: Date;

  constructor(config?: Partial<MockExecution>) {
    this.stateMachineArn = config?.stateMachineArn ?? STATE_MACHINE_ARN;
    this.executionArn = config?.executionArn ?? Math.random().toString(36).substring(2);
    this.messageGroupId = config?.messageGroupId ?? MESSAGE_GROUP_ID;
    this.status = config?.status ?? 'RUNNING';
    this.startDate = config?.startDate ?? new Date();
  }
}

const mockSetup = (currentExecution: MockExecution, ...extraExecutions: MockExecution[]): void => {
  const allExecutions = [currentExecution, ...extraExecutions];

  mockSFNClient.on(ListExecutionsCommand, { stateMachineArn: STATE_MACHINE_ARN }).resolves({
    executions: allExecutions.map(e => executionListItem(e)),
  });

  allExecutions.forEach(execution => {
    mockSFNClient.on(DescribeExecutionCommand, { executionArn: execution.executionArn }).resolves({
      stateMachineArn: STATE_MACHINE_ARN,
      executionArn: execution.executionArn,
      input: executionInput(execution.messageGroupId),
      startDate: execution.startDate,
    });
  });
};

const executionListItem = (execution: MockExecution): ExecutionListItem => {
  return {
    stateMachineArn: execution.stateMachineArn,
    executionArn: execution.executionArn,
    status: execution.status,
    startDate: execution.startDate,
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

const getStartedBeforeWithSameId = (): unknown[] => {
  return (loggerSpy.mock.calls[0][1] as unknown as Record<string, never>).startedBeforeWithSameId;
};
