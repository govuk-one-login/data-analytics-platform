import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';

const event_id = randomUUID();

export const constructCreateAccountEmptyClientIdEvent = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  client_id: string,
  user_id: string,
  journey_id: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'AUTH_CREATE_ACCOUNT',
  client_id: client_id,
  component_id: 'AUTH',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  user: {
    govuk_signin_journey_id: journey_id,
    user_id: user_id,
  },
  txma: {
    configVersion: '1.1.28',
  },
});
