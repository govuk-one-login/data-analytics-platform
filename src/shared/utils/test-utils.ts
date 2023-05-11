import type { SQSEvent } from 'aws-lambda';

export const mockSQSEvent = (...bodies: unknown[]): SQSEvent => {
  return {
    Records: bodies.map((body, index) => ({
      body,
      messageId: (index + 1).toString(),
    })),
  } as unknown as SQSEvent;
};
