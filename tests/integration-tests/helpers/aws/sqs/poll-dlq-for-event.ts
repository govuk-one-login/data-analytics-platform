import { ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({});

export const pollDlqForEvent = async (
  dlqUrl: string,
  eventId: string,
  maxWaitMs = 20000,
  pollIntervalMs = 2000,
): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: dlqUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 2,
        VisibilityTimeout: 1,
      }),
    );

    const found = (response.Messages ?? []).some(message => message.Body?.includes(eventId));
    if (found) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  return false;
};
