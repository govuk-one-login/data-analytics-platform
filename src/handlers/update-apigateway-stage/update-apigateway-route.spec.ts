import { handler } from './update-apigateway-route';
import { ApiGatewayV2Client, UpdateRouteCommand } from '@aws-sdk/client-apigatewayv2';
import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import * as https from 'https';

jest.mock('@aws-sdk/client-apigatewayv2');
jest.mock('https');

const mockSend = jest.fn();
const mockApiGatewayV2Client = ApiGatewayV2Client as jest.MockedClass<typeof ApiGatewayV2Client>;
const mockHttps = https as jest.Mocked<typeof https>;

const mockRequest = {
  on: jest.fn(),
  write: jest.fn(),
  end: jest.fn(),
};

mockHttps.request = jest.fn().mockReturnValue(mockRequest);

describe('update-apigateway-route handler', () => {
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
      RouteKey: '$default',
      IntegrationId: 'test-integration-id',
    },
  } as CloudFormationCustomResourceEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGatewayV2Client.prototype.send = mockSend;
    mockRequest.on.mockReturnValue(mockRequest);
    (mockHttps.request as jest.Mock).mockReturnValue(mockRequest);
  });

  it('should update route on Create request', async () => {
    mockSend.mockResolvedValue({});

    await handler(mockEvent, mockContext);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          ApiId: 'test-api-id',
          RouteKey: '$default',
          Target: 'integrations/test-integration-id',
        },
      }),
    );
  });

  it('should update route on Update request', async () => {
    const updateEvent = { ...mockEvent, RequestType: 'Update' as const };
    mockSend.mockResolvedValue({});

    await handler(updateEvent, mockContext);

    expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateRouteCommand));
  });

  it('should not update route on Delete request', async () => {
    const deleteEvent = { ...mockEvent, RequestType: 'Delete' as const };

    await handler(deleteEvent, mockContext);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should handle API Gateway errors', async () => {
    mockSend.mockRejectedValue(new Error('API Gateway error'));

    await handler(mockEvent, mockContext);

    expect(mockSend).toHaveBeenCalled();
  });
});
