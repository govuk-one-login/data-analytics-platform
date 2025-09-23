import { SQSEvent, SQSRecord } from 'aws-lambda';
import mockSQSEvent from '../../../sharedTestCode/test-auth-event.json'
import { randomUUID } from 'crypto';
import { AuditEvent } from '../../../../common/types/audit-event';

export const createSqsEvent = (auditEvent: AuditEvent): SQSEvent => {
  return {
    Records: [
      {
        ...mockSQSEvent.Records[0],
        messageId: randomUUID(),
        body: JSON.stringify(auditEvent),
      },
    ],
  };
};

export const createSqsEventV2 = (record: SQSRecord[]): SQSEvent => {
  return {
    Records: record,
  };
};

export function selectRandomValues<T>(list: T[], poolSize: number): T[] {
  if (poolSize > list.length) {
    throw new Error('Cannot select more values than the list contains.');
  }

  const shuffledList = [...list].sort(() => 0.5 - Math.random());
  return shuffledList.slice(0, poolSize);
}
