export type AuditEvent = {
  event_name: string;
  timestamp: number;
  event_id: string;
  component_id?: string;
  [key: string]: unknown;
};

export const validateAuditEvent = (auditEvent: AuditEvent): string[] => {
  if (typeof auditEvent !== 'object' || auditEvent === null) {
    return ['Audit event is not an object'];
  }

  const errorTypes = [
    {
      errorMessage: 'Event name is missing from audit event or is invalid',
      condition: typeof auditEvent.event_name !== 'string' || auditEvent.event_name.length === 0,
    },
    {
      errorMessage: 'Timestamp is missing from audit event or is invalid',
      condition: typeof auditEvent.timestamp !== 'number',
    },
    {
      errorMessage: 'Timestamp is in milliseconds, expected seconds',
      condition: typeof auditEvent.timestamp === 'number' && !isValidTimestamp(auditEvent.timestamp),
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
  return !isNaN(date.getTime()) && timestamp < 1e12; // not a timestamp in ms;
};
