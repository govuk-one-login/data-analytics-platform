import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';

const event_id = randomUUID();

export const constructAuthMfaMethodAlternativeRequestedTestEvent6 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  client_id: string,
  user_id: string,
  journey_id: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'AUTH_MFA_METHOD_ALTERNATIVE_REQUESTED',
  client_id: client_id,
  component_id: 'cj1ewiw8knw1i71dot5m',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  user: {
    user_id: user_id,
    govuk_signin_journey_id: journey_id,
    email: 'tg7696m1x7dlgeci9s3yi48jn08uxn1o374bn3r7eirzz6o2svq58b4rval1ebnl',
    phone: '6ntqcwjq0uoad2mwg1wfehlt53itw9iuzfgfy51qrf8z61qw8ndrnxor7wdp9idn',
    persistent_session_id: '8mnyr6yyan2i1ytn087so2tsk2d26zm9inw',
    transaction_id: '72rf7c33q43d6c1y8cw2',
  },
});

// Test Event 6: Expected raw layer row data
export const constructAuthMfaMethodAlternativeRequestedTestEvent6ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  client_id: string,
  user_id: string,
  journey_id: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'AUTH_MFA_METHOD_ALTERNATIVE_REQUESTED',
    component_id: 'cj1ewiw8knw1i71dot5m',
    client_id: client_id,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: `{"user_id":"${user_id}","govuk_signin_journey_id":"${journey_id}","email":"tg7696m1x7dlgeci9s3yi48jn08uxn1o374bn3r7eirzz6o2svq58b4rval1ebnl","phone":"6ntqcwjq0uoad2mwg1wfehlt53itw9iuzfgfy51qrf8z61qw8ndrnxor7wdp9idn","persistent_session_id":"8mnyr6yyan2i1ytn087so2tsk2d26zm9inw","transaction_id":"72rf7c33q43d6c1y8cw2"}`,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions: null,
    txma: null,
    datecreated: datecreated,
  });

// Test Event 6: Expected stage layer row data
export const constructAuthMfaMethodAlternativeRequestedTestEvent6ExpectedStageLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  client_id: string,
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
    client_id: client_id,
    component_id: 'cj1ewiw8knw1i71dot5m',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: journey_id,
    user_user_id: user_id,
    partition_event_name: 'AUTH_MFA_METHOD_ALTERNATIVE_REQUESTED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'AUTH_MFA_METHOD_ALTERNATIVE_REQUESTED',
  });

// Test Event 6: Expected stage layer key values data
export const constructAuthMfaMethodAlternativeRequestedTestEvent6ExpectedStageLayerKeyValues = () => undefined;
