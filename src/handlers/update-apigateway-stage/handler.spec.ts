import { ApiGatewayV2Client, UpdateStageCommand } from '@aws-sdk/client-apigatewayv2';
import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import * as https from 'https';

const mockApiGatewayV2Client = mockClient(ApiGatewayV2Client);

// Mock https module to avoid actual HTTP requests
jest.mock('https', () => ({
  request: jest.fn(),
}));

// Mock the logger
jest.mock('../../shared/powertools', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

import { handler } from './handler';
const mockHttps = https as jest.Mocked<typeof https>;

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

    // Mock https.request to simulate CloudFormation response
    const mockRequest = {
      on: jest.fn().mockReturnThis(),
      write: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };

    mockHttps.request = jest.fn().mockImplementation((options, callback) => {
      if (callback) {
        callback({ statusCode: 200 } as https.IncomingMessage);
      }
      return mockRequest as https.ClientRequest;
    });
  });

  it('should update stage on Create request', async () => {
    mockApiGatewayV2Client.resolves({});

    await handler(mockEvent, mockContext);

    expect(mockApiGatewayV2Client.calls()).toHaveLength(1);
    const call = mockApiGatewayV2Client.calls()[0];
    expect(call.args[0]).toBeInstanceOf(UpdateStageCommand);
    expect(call.args[0].input).toMatchObject({
      ApiId: 'test-api-id',
      StageName: '$default',
      AccessLogSettings: {
        DestinationArn: 'arn:aws:logs:region:account:log-group:test',
      },
    });
  });

  it('should update stage on Update request', async () => {
    const updateEvent = { ...mockEvent, RequestType: 'Update' as const };
    mockApiGatewayV2Client.resolves({});

    await handler(updateEvent, mockContext);

    expect(mockApiGatewayV2Client.calls()).toHaveLength(1);
  });

  it('should not update stage on Delete request', async () => {
    const deleteEvent = { ...mockEvent, RequestType: 'Delete' as const };

    await handler(deleteEvent, mockContext);

    expect(mockApiGatewayV2Client.calls()).toHaveLength(0);
  });

  it('should handle API Gateway errors', async () => {
    mockApiGatewayV2Client.rejects(new Error('API Gateway error'));

    await expect(handler(mockEvent, mockContext)).resolves.not.toThrow();

    expect(mockApiGatewayV2Client.calls()).toHaveLength(1);
  });

  it('should handle missing ResourceProperties', async () => {
    const eventWithoutProps = { ...mockEvent, ResourceProperties: undefined };

    await expect(handler(eventWithoutProps as CloudFormationCustomResourceEvent, mockContext)).resolves.not.toThrow();

    expect(mockApiGatewayV2Client.calls()).toHaveLength(0);
  });

  it('should handle missing required properties', async () => {
    const eventWithMissingProps = {
      ...mockEvent,
      ResourceProperties: { ApiId: 'test-api-id' },
    };

    await expect(
      handler(eventWithMissingProps as CloudFormationCustomResourceEvent, mockContext),
    ).resolves.not.toThrow();

    expect(mockApiGatewayV2Client.calls()).toHaveLength(0);
  });

  it('should handle Create and Update request types', async () => {
    const createEvent = { ...mockEvent, RequestType: 'Create' as const };
    const updateEvent = { ...mockEvent, RequestType: 'Update' as const };

    mockApiGatewayV2Client.resolves({});

    await expect(handler(createEvent, mockContext)).resolves.not.toThrow();
    expect(mockApiGatewayV2Client.calls()).toHaveLength(1);

    mockApiGatewayV2Client.reset();
    mockApiGatewayV2Client.resolves({});

    await expect(handler(updateEvent, mockContext)).resolves.not.toThrow();
    expect(mockApiGatewayV2Client.calls()).toHaveLength(1);
  });

  it('should handle Delete request type', async () => {
    const deleteEvent = { ...mockEvent, RequestType: 'Delete' as const };

    await expect(handler(deleteEvent, mockContext)).resolves.not.toThrow();
    expect(mockApiGatewayV2Client.calls()).toHaveLength(0);
  });

  it('should handle missing ResourceProperties scenario', async () => {
    const eventWithoutProps = { ...mockEvent, ResourceProperties: undefined };

    await expect(handler(eventWithoutProps as CloudFormationCustomResourceEvent, mockContext)).resolves.not.toThrow();
    expect(mockApiGatewayV2Client.calls()).toHaveLength(0);
  });

  it('should handle incomplete ResourceProperties scenario', async () => {
    const eventWithIncompleteProps = { ...mockEvent, ResourceProperties: { ApiId: 'test' } };

    await expect(
      handler(eventWithIncompleteProps as CloudFormationCustomResourceEvent, mockContext),
    ).resolves.not.toThrow();
    expect(mockApiGatewayV2Client.calls()).toHaveLength(0);
  });

  it('should handle unexpected errors in handler', async () => {
    // Force an error by making the event malformed
    const malformedEvent = null as unknown as CloudFormationCustomResourceEvent;

    await expect(handler(malformedEvent, mockContext)).resolves.not.toThrow();
  });
});
