import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';
import { buildExpectedStageLayerKeyValues } from '../../helpers/builders/stage-layer-key-values-builder';

const event_id = randomUUID();

export const constructDCMAWAsyncBiometricTokenIssuedDAPEvent = (
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

// Expected raw layer row data based on actual query results
export const constructDCMAWAsyncBiometricTokenIssuedExpectedRawLayerRow = (
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
    event_name: 'DCMAW_ASYNC_BIOMETRIC_TOKEN_ISSUED',
    component_id: 'https://review-b-async.staging.account.gov.uk',
    client_id: client_id,
    timestamp: timestamp,
    timestamp_formatted,
    user: `{"govuk_signin_journey_id":"${journey_id}","user_id":"${user_id}","session_id":"mySessionId"}`,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted,
    extensions: '{"documenttype":"NFC_PASSPORT"}',
    txma: `{"enrichment":[{"event_id":"${event_id}","service":"client_id_enrichment","count":"0"}]}`,
    datecreated: datecreated,
  });

// Expected stage layer row data
export const constructDCMAWAsyncBiometricTokenIssuedExpectedStageLayerRow = (
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
    component_id: 'https://review-b-async.staging.account.gov.uk',
    timestamp: timestamp,
    timestamp_formatted,
    user_govuk_signin_journey_id: journey_id,
    user_user_id: user_id,
    partition_event_name: 'DCMAW_ASYNC_BIOMETRIC_TOKEN_ISSUED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'DCMAW_ASYNC_BIOMETRIC_TOKEN_ISSUED',
  });

// Expected stage layer key values data
export const constructDCMAWAsyncBiometricTokenIssuedExpectedStageLayerKeyValues = (
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerKeyValues([
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'documenttype',
      value: 'NFC_PASSPORT',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'txma',
      key: 'enrichment[0].service',
      value: 'client_id_enrichment',
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
    {
      event_id: event_id,
      parent_column_name: 'txma',
      key: 'enrichment[0].count',
      value: '0',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
  ]);

// Expected conformed layer data
export const constructDCMAWAsyncBiometricTokenIssuedExpectedConformedData = (
  user_id: string,
  journey_id: string,
  date: string,
) => ({
  fact: {
    event_id: event_id,
    component_id: 'https://review-b-async.staging.account.gov.uk',
  },
  dimUserJourney: {
    user_govuk_signin_journey_id: journey_id,
  },
  dimEvent: {
    event_name: 'DCMAW_ASYNC_BIOMETRIC_TOKEN_ISSUED',
  },
  dimUser: {
    user_id: user_id,
  },
  dimJourneyChannel: {
    channel_name: 'App',
  },
  dimDate: {
    date: date,
  },
  extensions: [
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'documenttype',
      event_attribute_value: 'NFC_PASSPORT',
    },
    {
      parent_attribute_name: 'txma',
      event_attribute_name: 'enrichment[0].count',
      event_attribute_value: '0',
    },
    {
      parent_attribute_name: 'txma',
      event_attribute_name: 'enrichment[0].event_id',
      event_attribute_value: event_id,
    },
    {
      parent_attribute_name: 'txma',
      event_attribute_name: 'enrichment[0].service',
      event_attribute_value: 'client_id_enrichment',
    },
  ],
});
