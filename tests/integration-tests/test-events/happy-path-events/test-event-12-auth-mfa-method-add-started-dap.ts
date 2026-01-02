import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';
import { buildExpectedStageLayerKeyValues } from '../../helpers/builders/stage-layer-key-values-builder';

const event_id = randomUUID();

export const constructAuthMfaMethodAddStartedTestEvent12 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'AUTH_MFA_METHOD_ADD_STARTED',
  component_id: 'tj8gzybtwf2qko4hjkxa',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  txma: {
    configVersion: '1.3.63',
  },
});

// Test Event 12: Expected raw layer row data
export const constructAuthMfaMethodAddStartedTestEvent12ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'AUTH_MFA_METHOD_ADD_STARTED',
    component_id: 'tj8gzybtwf2qko4hjkxa',
    client_id: null,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: null,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions: null,
    txma: '{"configversion":"1.3.63"}',
    datecreated: datecreated,
  });

// Test Event 12: Expected stage layer row data
export const constructAuthMfaMethodAddStartedTestEvent12ExpectedStageLayerRow = (
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
    component_id: 'tj8gzybtwf2qko4hjkxa',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: null,
    user_user_id: null,
    partition_event_name: 'AUTH_MFA_METHOD_ADD_STARTED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'AUTH_MFA_METHOD_ADD_STARTED',
  });

// Test Event 12: Expected stage layer key values data
export const constructAuthMfaMethodAddStartedTestEvent12ExpectedStageLayerKeyValues = (
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerKeyValues([
    {
      event_id: event_id,
      parent_column_name: 'txma',
      key: 'configversion',
      value: '1.3.63',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
  ]);

// Test Event 12: Expected conformed layer data
export const constructAuthMfaMethodAddStartedTestEvent12ExpectedConformedData = (date: string) => ({
  fact: { event_id: event_id, component_id: 'tj8gzybtwf2qko4hjkxa' },
  dimUserJourney: { user_govuk_signin_journey_id: null },
  dimEvent: { event_name: 'AUTH_MFA_METHOD_ADD_STARTED' },
  dimJourneyChannel: { channel_name: 'General' },
  dimDate: { date: date },
  extensions: [
    {
      parent_attribute_name: 'txma',
      event_attribute_name: 'configversion',
      event_attribute_value: '1.3.63',
    },
  ],
});
