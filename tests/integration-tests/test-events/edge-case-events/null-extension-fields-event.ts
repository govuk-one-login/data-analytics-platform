import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedStageLayerKeyValues } from '../../helpers/builders/stage-layer-key-values-builder';

const event_id = randomUUID();

export const constructDCMAWNullFieldsEvent = (
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
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  user: {
    govuk_signin_journey_id: journey_id,
    session_id: 'mySessionId',
    user_id: user_id,
  },
  extensions: {
    documentType: null,
    opaque_id: '44444444-4444-4444-4444-444444444444',
    redirect_uri: 'null',
  },
  txma: {
    enrichment: [
      {
        service: null,
        event_id: event_id,
        count: 'null',
      },
    ],
  },
});

export const constructDCMAWNullFieldsExpectedStageLayerKeyValues = (processed_dt: number, processed_time: number) =>
  buildExpectedStageLayerKeyValues([
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'opaque_id',
      value: '44444444-4444-4444-4444-444444444444',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'txma',
      key: 'enrichment[0].event_id',
      value: event_id,
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
  ]);
