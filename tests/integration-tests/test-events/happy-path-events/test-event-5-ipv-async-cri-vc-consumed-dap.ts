import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';

const event_id = randomUUID();

export const constructIPVAsyncCriVcConsumedTestEvent5 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  user_id: string,
  journey_id: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'IPV_ASYNC_CRI_VC_CONSUMED',
  component_id: 'we53dkaadezkw05yurte',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  user: {
    user_id: user_id,
    govuk_signin_journey_id: journey_id,
    ip_address: '254.176.1.12',
    session_id: 'mySessionId',
  },
});

// Test Event 5: Expected raw layer row data
export const constructIPVAsyncCriVcConsumedTestEvent5ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  user_id: string,
  journey_id: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'IPV_ASYNC_CRI_VC_CONSUMED',
    component_id: 'we53dkaadezkw05yurte',
    client_id: null,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: `{"user_id":"${user_id}","govuk_signin_journey_id":"${journey_id}","ip_address":"254.176.1.12","session_id":"mySessionId"}`,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions: null,
    txma: null,
    datecreated: datecreated,
  });

// Test Event 5: Expected stage layer row data
export const constructIPVAsyncCriVcConsumedTestEvent5ExpectedStageLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  user_id: string,
  journey_id: string,
  year: number,
  month: number,
  day: number,
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerRow({
    event_id: event_id,
    client_id: null,
    component_id: 'we53dkaadezkw05yurte',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: journey_id,
    user_user_id: user_id,
    partition_event_name: 'IPV_ASYNC_CRI_VC_CONSUMED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'IPV_ASYNC_CRI_VC_CONSUMED',
  });

// Test Event 5: Expected stage layer key values data
export const constructIPVAsyncCriVcConsumedTestEvent5ExpectedStageLayerKeyValues = () => undefined;
