import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '../../../../../src/shared/clients';
import { AuditEvent } from '../../../../../src/shared/types/event';

export const addMessageToQueue = async (event: AuditEvent, queueUrl: string) => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(event),
  });
  await sqsClient.send(command);
};
