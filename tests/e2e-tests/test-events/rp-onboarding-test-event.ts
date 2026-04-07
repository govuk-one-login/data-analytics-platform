import { AuditEvent } from '../../../common/types/event';
import { randomUUID } from 'node:crypto';

export const constructTestEvent = (clientId: string, timestamp: number, timestampFormatted: string): AuditEvent => ({
  event_id: randomUUID(),
  event_name: 'AUTH_AUTHORISATION_INITIATED',
  client_id: clientId,
  component_id: 'e2e-test',
  timestamp,
  timestamp_formatted: timestampFormatted,
});
