export type AuditEvent = {
  event_name: string;
  timestamp: number;
  event_id: string;
  component_id?: string;
  [key: string]: unknown;
};

export const validateAuditEvent = (auditEvent: AuditEvent): string[] => {
  const errorTypes = [
    {
      errorMessage: 'Audit event is not an object',
      condition: typeof auditEvent !== 'object' || auditEvent === null,
    },
    {
      errorMessage: 'Event name is missing from audit event or is invalid',
      condition: typeof auditEvent.event_name !== 'string' || auditEvent.event_name.length === 0,
    },
    {
      errorMessage: 'Timestamp is larger than expected value',
      condition: !isValidTimestamp(auditEvent.timestamp),
    },
    {
      errorMessage: 'Timestamp is not a integer',
      condition: typeof auditEvent.timestamp !== 'number',
    },
  ];

  return errorTypes.reduce((acc, errorType) => {
    if (errorType.condition) {
      acc.push(errorType.errorMessage);
    }

    return acc;
  }, [] as string[]);
};

const isValidTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && timestamp < 1e13; // not a timestamp in ms;
};
