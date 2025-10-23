export type AuditEvent = {
  event_name: string;
  timestamp: number;
  event_id: string;
  component_id?: string;
  [key: string]: unknown;
};

export const isValidAuditEvent = (auditEvent: AuditEvent): auditEvent is AuditEvent => {
  return (
    typeof auditEvent === 'object' &&
    auditEvent !== null &&
    typeof auditEvent.event_name === 'string' &&
    auditEvent.event_name.length > 0 &&
    typeof auditEvent.timestamp === 'number' &&
    isValidTimestamp(auditEvent.timestamp)
  );
};

const isValidTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && timestamp < 1e13; // not a timestamp in ms;
};

export type RawLayerEvent = {
  event_id: string;
  event_name: string;
  component_id: string;
  client_id: string;
  timestamp: string;
  timestamp_formatted: string;
  user: string; // JSON string
  event_timestamp_ms: string;
  event_timestamp_ms_formatted: string;
  extensions: string; // JSON string
  restricted: null;
  txma: string; // JSON string
  datecreated: string; // partition format
};
