import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';

const event_id = randomUUID();

export const constructTimestampInMsEvent = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  client_id: string,
  user_id: string,
  journey_id: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'DCMAW_ASYNC_BIOMETRIC_TOKEN_ISSUED',
  client_id: client_id,
  component_id: 'https://review-b-async.staging.account.gov.uk',
  timestamp: event_timestamp_ms,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  user: {
    govuk_signin_journey_id: journey_id,
    session_id: 'mySessionId',
    user_id: user_id,
  },
  extensions: {
    documentType: 'NFC_PASSPORT',
  },
  txma: {
    enrichment: [
      {
        service: 'client_id_enrichment',
        event_id: event_id,
        count: 0,
      },
    ],
  },
});
