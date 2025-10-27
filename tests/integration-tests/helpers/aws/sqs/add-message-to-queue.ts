import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { AuditEvent } from '../../../../../common/types/event';

const sqsClient = new SQSClient({});

export const addMessageToQueue = async (event: AuditEvent, queueUrl: string) => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(event),
  });
  await sqsClient.send(command);
};
