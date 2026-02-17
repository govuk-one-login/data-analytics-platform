import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';
import { buildExpectedStageLayerKeyValues } from '../../helpers/builders/stage-layer-key-values-builder';

const event_id = randomUUID();

export const constructAuthEmailFraudCheckResponseReceivedTestEvent8 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'AUTH_EMAIL_FRAUD_CHECK_RESPONSE_RECEIVED',
  component_id: 'zygiwnzbjy3edxx4e9a0',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  extensions: {
    'journey-type': 'MFA_BACKUP',
    'mfa-type': 'APP',
    'mfa-method': 'primary',
    phone_number_country_code: '+1',
  },
});

// Test Event 8: Expected raw layer row data
export const constructAuthEmailFraudCheckResponseReceivedTestEvent8ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'AUTH_EMAIL_FRAUD_CHECK_RESPONSE_RECEIVED',
    component_id: 'zygiwnzbjy3edxx4e9a0',
    client_id: null,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: null,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions:
      '{"journey-type":"MFA_BACKUP","mfa-type":"APP","mfa-method":"primary","phone_number_country_code":"+1"}',
    txma: null,
    datecreated: datecreated,
  });

// Test Event 8: Expected stage layer row data
export const constructAuthEmailFraudCheckResponseReceivedTestEvent8ExpectedStageLayerRow = (
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
    component_id: 'zygiwnzbjy3edxx4e9a0',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: null,
    user_user_id: null,
    partition_event_name: 'AUTH_EMAIL_FRAUD_CHECK_RESPONSE_RECEIVED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'AUTH_EMAIL_FRAUD_CHECK_RESPONSE_RECEIVED',
  });

// Test Event 8: Expected stage layer key values data
export const constructAuthEmailFraudCheckResponseReceivedTestEvent8ExpectedStageLayerKeyValues = (
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerKeyValues([
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'journey-type',
      value: 'MFA_BACKUP',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'mfa-type',
      value: 'APP',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'mfa-method',
      value: 'primary',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'phone_number_country_code',
      value: '1',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
  ]);

// Test Event 8: Expected conformed layer data
export const constructAuthEmailFraudCheckResponseReceivedTestEvent8ExpectedConformedData = (date: string) => ({
  fact: { event_id: event_id, component_id: 'zygiwnzbjy3edxx4e9a0' },
  dimUserJourney: { user_govuk_signin_journey_id: null },
  dimEvent: { event_name: 'AUTH_EMAIL_FRAUD_CHECK_RESPONSE_RECEIVED' },
  dimJourneyChannel: { channel_name: 'General' },
  dimDate: { date: date },
  extensions: [
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'journey-type',
      event_attribute_value: 'MFA_BACKUP',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'mfa-method',
      event_attribute_value: 'primary',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'mfa-type',
      event_attribute_value: 'APP',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'phone_number_country_code',
      event_attribute_value: '1',
    },
  ],
});
