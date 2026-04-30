import { CloudWatchLogsEvent } from 'aws-lambda';
import { gzipSync } from 'node:zlib';

interface MockLogMessage {
  details?: {
    output?: string;
  };
  execution_arn?: string;
}

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: vi.fn().mockImplementation(function (this: object) {
    (this as { send: typeof mockSend }).send = mockSend;
  }),
  PutEventsCommand: vi.fn().mockImplementation(function (this: object, input: unknown) {
    (this as { input: unknown }).input = input;
  }),
}));

vi.mock('@aws-lambda-powertools/logger', () => ({
  Logger: vi.fn().mockImplementation(function (this: object) {
    (this as { error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> }).error = vi.fn();
    (this as { error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> }).info = vi.fn();
  }),
}));

import { handler } from './handler';

describe('redshift-error-notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
    process.env.AWS_REGION = 'eu-west-2';
  });

  const createMockEvent = (logMessage: MockLogMessage): CloudWatchLogsEvent => {
    const logData = {
      logEvents: [
        {
          timestamp: 1633024800000,
          message: JSON.stringify(logMessage),
        },
      ],
    };

    const compressed = gzipSync(JSON.stringify(logData));

    return {
      awslogs: {
        data: compressed.toString('base64'),
      },
    };
  };

  it('should send EventBridge event for failed Redshift stored procedure', async () => {
    // Unit Test
    const logMessage = {
      details: {
        output: JSON.stringify({
          sql_output: {
            Status: 'FAILED',
            Error: 'ERROR: Value too long for character type',
            QueryString: 'call conformed_refactored.update_dap_data_mart()',
            Database: 'dap_txma_reporting_db_refactored',
            WorkgroupName: 'dev-redshift-serverless-workgroup',
          },
        }),
      },
      execution_arn: 'arn:aws:states:eu-west-2:123456789012:execution:test:123',
    };

    const event = createMockEvent(logMessage);

    await handler(event);

    expect(mockSend).toHaveBeenCalledTimes(1);

    const putEventsCommand = mockSend.mock.calls[0][0];
    expect(putEventsCommand.input.Entries).toHaveLength(1);
    expect(putEventsCommand.input.Entries[0].Source).toBe('dap.redshift.errors');
    expect(putEventsCommand.input.Entries[0].DetailType).toBe('Redshift Error');

    const detail = JSON.parse(putEventsCommand.input.Entries[0].Detail);
    expect(detail.subject).toBe('DAP Redshift Stored Procedure Failure');
    expect(detail.notification.content.description).toContain('Value too long for character type');
  });

  it('should not send notification for successful queries', async () => {
    // Unit Test
    const logMessage = {
      details: {
        output: JSON.stringify({
          sql_output: {
            Status: 'FINISHED',
            QueryString: 'call conformed_refactored.update_dap_data_mart()',
          },
        }),
      },
    };

    const event = createMockEvent(logMessage);
    await handler(event);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should not send notification when no error details present', async () => {
    // Unit Test
    const logMessage = {
      details: {
        output: JSON.stringify({
          sql_output: {
            Status: 'FAILED',
            QueryString: 'call conformed_refactored.update_dap_data_mart()',
          },
          Error: 'Some error occured but details are missing',
        }),
      },
    };

    const event = createMockEvent(logMessage);
    await handler(event);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should handle missing details.output', async () => {
    // Unit Test
    const logMessage = {
      details: {},
    };

    const event = createMockEvent(logMessage);
    await handler(event);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should throw error when EventBridge publish fails', async () => {
    // Unit Test
    mockSend.mockRejectedValue(new Error('EventBridge Error'));

    const logMessage = {
      details: {
        output: JSON.stringify({
          sql_output: {
            Status: 'FAILED',
            Error: 'Test error',
            QueryString: 'test query',
            Database: 'test_db',
            WorkgroupName: 'test_workgroup',
          },
        }),
      },
    };

    const event = createMockEvent(logMessage);
    await expect(handler(event)).rejects.toThrow('EventBridge Error');
  });
});
