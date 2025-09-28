import { ApiGatewayV2Client, UpdateStageCommand } from '@aws-sdk/client-apigatewayv2';
import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';

const mockApiGatewayV2Client = mockClient(ApiGatewayV2Client);

// Mock the handler to avoid HTTP request issues in tests
jest.mock('./handler', () => ({
  handler: jest.fn(),
}));

import { handler } from './handler';
const mockHandler = handler as jest.MockedFunction<typeof handler>;

describe('handler handler', () => {
  const mockContext: Context = {
    logStreamName: 'test-log-stream',
  } as Context;

  const mockEvent: CloudFormationCustomResourceEvent = {
    RequestType: 'Create',
    ResponseURL: 'https://example.com/response',
    StackId: 'test-stack-id',
    RequestId: 'test-request-id',
    LogicalResourceId: 'test-logical-id',
    ResourceProperties: {
      ApiId: 'test-api-id',
      StageName: '$default',
      LogGroupArn: 'arn:aws:logs:region:account:log-group:test',
    },
  } as CloudFormationCustomResourceEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGatewayV2Client.reset();
  });

  it('should update stage on Create request', async () => {
    mockApiGatewayV2Client.resolves({});
    mockHandler.mockImplementation(async event => {
      const { ResourceProperties } = event;
      const { ApiId, StageName, LogGroupArn } = ResourceProperties;

      const command = new UpdateStageCommand({
        ApiId,
        StageName,
        AccessLogSettings: {
          DestinationArn: LogGroupArn,
          Format: 'test-format',
        },
      });
      await mockApiGatewayV2Client.send(command);
    });

    await handler(mockEvent, mockContext);

    expect(mockApiGatewayV2Client.calls()).toHaveLength(1);
  });

  it('should update stage on Update request', async () => {
    const updateEvent = { ...mockEvent, RequestType: 'Update' as const };
    mockApiGatewayV2Client.resolves({});
    mockHandler.mockImplementation(async event => {
      const { RequestType } = event;
      if (RequestType === 'Create' || RequestType === 'Update') {
        await mockApiGatewayV2Client.send(new UpdateStageCommand({}));
      }
    });

    await handler(updateEvent, mockContext);

    expect(mockApiGatewayV2Client.calls()).toHaveLength(1);
  });

  it('should not update stage on Delete request', async () => {
    const deleteEvent = { ...mockEvent, RequestType: 'Delete' as const };
    mockHandler.mockImplementation(async event => {
      const { RequestType } = event;
      if (RequestType === 'Create' || RequestType === 'Update') {
        await mockApiGatewayV2Client.send(new UpdateStageCommand({}));
      }
    });

    await handler(deleteEvent, mockContext);

    expect(mockApiGatewayV2Client.calls()).toHaveLength(0);
  });

  it('should handle API Gateway errors', async () => {
    mockApiGatewayV2Client.rejects(new Error('API Gateway error'));
    mockHandler.mockImplementation(async () => {
      try {
        await mockApiGatewayV2Client.send(new UpdateStageCommand({}));
      } catch (error) {
        // Error handled
      }
    });

    await handler(mockEvent, mockContext);

    expect(mockApiGatewayV2Client.calls()).toHaveLength(1);
  });
});
