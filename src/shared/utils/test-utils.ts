import type { APIGatewayProxyEventV2, SQSEvent } from 'aws-lambda';
import { readFile } from 'fs/promises';
import type { Readable } from 'stream';
import type { SdkStream } from '@aws-sdk/types';
import type { AttributeType } from '@aws-sdk/client-cognito-identity-provider';

export const mockSQSEvent = (...bodies: unknown[]): SQSEvent => {
  return {
    Records: bodies.map((body, index) => ({
      body,
      messageId: (index + 1).toString(),
    })),
  } as unknown as SQSEvent;
};

export const getTestResource = async (filename: string, encoding: BufferEncoding = 'utf-8'): Promise<string> => {
  return await readFile(`src/test-resources/${filename}`, { encoding });
};

interface BodyStreamParams {
  stringValue?: unknown;
  byteValue?: unknown;
}

type BodyStream = SdkStream<Readable | ReadableStream | Blob>;

export const mockS3BodyStream = ({ stringValue, byteValue }: BodyStreamParams): BodyStream => {
  const mockBodyStream: unknown = {
    transformToString: async () => stringValue,
    transformToByteArray: async () => byteValue,
  };
  return mockBodyStream as BodyStream;
};

export const mockApiGatewayEvent = async (
  queryParams: Record<string, string>,
  accountId: string,
): Promise<APIGatewayProxyEventV2> => {
  const apiGatewayEvent: APIGatewayProxyEventV2 = JSON.parse(await getTestResource('api-gateway-event.json'));
  return {
    ...apiGatewayEvent,
    rawQueryString: new URLSearchParams(queryParams).toString(),
    queryStringParameters: queryParams,
    requestContext: {
      ...apiGatewayEvent.requestContext,
      accountId,
    },
  };
};

interface MockCognitoUser {
  Username: string;
  UserAttributes: AttributeType[];
}

export const mockCognitoUser = (username: string, email: string): MockCognitoUser => {
  return { Username: username, UserAttributes: [{ Name: 'email', Value: email }] };
};
