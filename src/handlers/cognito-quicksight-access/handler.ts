import { getLogger } from '../../shared/powertools';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { quicksightClient } from '../../shared/clients';
import { GenerateEmbedUrlForRegisteredUserCommand } from '@aws-sdk/client-quicksight';
import { getAWSEnvironment, getEnvironmentVariable } from '../../shared/utils/utils';

export const logger = getLogger('lambda/cognito-quicksight-access');

// see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;

const getCognitoClientId = (): string => getEnvironmentVariable('COGNITO_CLIENT_ID');

const getCognitoDomain = (): string => getEnvironmentVariable('COGNITO_DOMAIN');

export interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfoResponse {
  sub: string;
  email: string;
  email_verified: string;
  username: string;
}

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
  try {
    const code = await getCode(event);
    const tokens = await callTokenEndpoint(event.requestContext.domainName, code);
    const userInfo = await callUserInfoEndpoint(tokens);
    const embedUrl = await getEmbedUrl(event.requestContext.accountId, userInfo.username);
    return {
      statusCode: 302, // temporary redirect (instead of permanent 301) to avoid browser caching
      headers: {
        Location: embedUrl,
      },
    };
  } catch (error) {
    logger.error('Error getting embed URL', { error, event });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: getErrorHTML(context.awsRequestId),
    };
  }
};

const getCode = async (event: APIGatewayProxyEventV2): Promise<string> => {
  const code = event?.queryStringParameters?.code;
  if (code === null || code === undefined || code.length === 0) {
    throw new Error(
      `code query param is missing or invalid - parameters are ${JSON.stringify(event.queryStringParameters)}`,
    );
  }
  return code;
};

// see https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
const callTokenEndpoint = async (apiGatewayDomainName: string, code: string): Promise<TokenResponse> => {
  const url = `${getCognitoDomain()}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getCognitoClientId(),
    redirect_uri: `https://${apiGatewayDomainName}`,
    code,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body,
  });

  return await fetchResponse(response, 'token');
};

// see https://docs.aws.amazon.com/cognito/latest/developerguide/userinfo-endpoint.html
const callUserInfoEndpoint = async (tokens: TokenResponse): Promise<UserInfoResponse> => {
  const url = `${getCognitoDomain()}/oauth2/userInfo`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  return await fetchResponse(response, 'userInfo');
};

const fetchResponse = async <T>(response: Response, endpointName: string): Promise<T> => {
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(
      `${response.status} ${response.statusText} error calling ${endpointName} endpoint - ${await response.text()}`,
    );
  }
};

const getEmbedUrl = async (accountId: string, username: string): Promise<string> => {
  const userArn = `arn:aws:quicksight:${region}:${accountId}:user/default/${username}`;
  const request = new GenerateEmbedUrlForRegisteredUserCommand({
    AwsAccountId: accountId,
    UserArn: userArn,
    SessionLifetimeInMinutes: getAWSEnvironment() === 'production' ? 600 : 15,
    ExperienceConfiguration: {
      QuickSightConsole: {
        InitialPath: '/start/dashboards',
        FeatureConfigurations: {
          StatePersistence: {
            Enabled: true,
          },
        },
      },
    },
  });

  try {
    return await makeUrlRequest(request);
  } catch (error) {
    throw new Error(
      `Error getting quicksight embed url for userArn ${userArn} - ${JSON.stringify(
        error instanceof Error ? error.message : error,
      )}`,
    );
  }
};

const makeUrlRequest = async (request: GenerateEmbedUrlForRegisteredUserCommand): Promise<string> => {
  const url = await quicksightClient.send(request).then(response => response.EmbedUrl);
  if (url === undefined) {
    throw new Error('EmbedUrl is undefined');
  }
  return url;
};

const getErrorHTML = (requestId: string): string => `
  <style>code { font-size: 1.2em; user-select: all; }</style>
  <body>
    <h1>Error</h1>
    <p>
      An error occurred - please try again or contact your administrator quoting request id
      <code>${requestId}</code>
    </p>
  </body>
`;
