export type AuditEvent = {
  event_name: string;
  timestamp: number;
  event_id: string;
  component_id?: string;
  [key: string]: unknown;
};
