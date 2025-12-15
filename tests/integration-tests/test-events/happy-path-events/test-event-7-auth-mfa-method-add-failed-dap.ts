import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';
import { buildExpectedStageLayerKeyValues } from '../../helpers/builders/stage-layer-key-values-builder';

const event_id = randomUUID();

export const constructAuthMfaMethodAddFailedTestEvent7 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'AUTH_MFA_METHOD_ADD_FAILED',
  component_id: 'i043s47s5z217sznedtk',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  extensions: {
    redirect_uri: 'https://b8yoclcdj8.example.com/callback',
  },
});

// Test Event 7: Expected raw layer row data
export const constructAuthMfaMethodAddFailedTestEvent7ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'AUTH_MFA_METHOD_ADD_FAILED',
    component_id: 'i043s47s5z217sznedtk',
    client_id: null,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: null,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions: '{"redirect_uri":"https://b8yoclcdj8.example.com/callback"}',
    txma: null,
    datecreated: datecreated,
  });

// Test Event 7: Expected stage layer row data
export const constructAuthMfaMethodAddFailedTestEvent7ExpectedStageLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  year: number,
  month: number,
  day: number,
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerRow({
    event_id: event_id,
    client_id: null,
    component_id: 'i043s47s5z217sznedtk',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: null,
    user_user_id: null,
    partition_event_name: 'AUTH_MFA_METHOD_ADD_FAILED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'AUTH_MFA_METHOD_ADD_FAILED',
  });

// Test Event 7: Expected stage layer key values data
export const constructAuthMfaMethodAddFailedTestEvent7ExpectedStageLayerKeyValues = (
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerKeyValues([
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'redirect_uri',
      value: 'https://b8yoclcdj8.example.com/callback',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
  ]);
