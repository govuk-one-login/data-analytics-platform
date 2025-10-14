import { CloudWatchLogsEvent } from 'aws-lambda';
import { gzipSync } from 'zlib';

interface MockLogMessage {
  details?: {
    output?: string;
  };
  execution_arn?: string;
}

const mockSend = jest.fn();

// Mock modules before any imports
jest.doMock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PublishCommand: jest.fn().mockImplementation(input => ({ input })),
}));

jest.doMock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    error: jest.fn(),
  })),
}));

// Import handler after mocking
let handler: (event: CloudWatchLogsEvent) => Promise<void>;
beforeAll(async () => {
  const handlerModule = await import('./handler');
  handler = handlerModule.handler;
});

describe('redshift-error-notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:eu-west-2:123456789012:test-topic';
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

  it('should send SNS notification for failed Redshift stored procedure', async () => {
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

    const publishCommand = mockSend.mock.calls[0][0];
    expect(publishCommand.input.TopicArn).toBe(process.env.SNS_TOPIC_ARN);
    expect(publishCommand.input.Subject).toBe('DAP Redshift Stored Procedure Failure');
    expect(publishCommand.input.Message).toContain('Redshift Stored Procedure Failure');
    expect(publishCommand.input.Message).toContain('Value too long for character type');
  });

  it('should not send notification for successful queries', async () => {
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
    const logMessage = {
      details: {
        output: JSON.stringify({
          sql_output: {
            Status: 'FAILED',
            QueryString: 'call conformed_refactored.update_dap_data_mart()',
          },
        }),
      },
    };

    const event = createMockEvent(logMessage);
    await handler(event);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should handle missing details.output', async () => {
    const logMessage = {
      details: {},
    };

    const event = createMockEvent(logMessage);
    await handler(event);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should throw error when SNS publish fails', async () => {
    mockSend.mockRejectedValue(new Error('SNS Error'));

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

    await expect(handler(event)).rejects.toThrow('SNS Error');
  });
});
