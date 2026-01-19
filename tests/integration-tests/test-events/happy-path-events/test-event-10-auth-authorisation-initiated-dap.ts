import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';
import { buildExpectedStageLayerKeyValues } from '../../helpers/builders/stage-layer-key-values-builder';

const event_id = randomUUID();

export const constructAuthAuthorisationInitiatedTestEvent10 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'AUTH_AUTHORISATION_INITIATED',
  component_id: 'm1kw1pm464p4hcek2j8s',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  extensions: {
    evidence: [
      {
        checkDetails: [
          {
            checkMethod: '0p7nl0a1',
            identityCheckPolicy: 'published',
            biometricVerificationProcessLevel: 2,
          },
        ],
        strengthScore: 4,
        type: 'IdentityCheck',
        validityScore: 1,
        verificationScore: 2,
      },
    ],
  },
});

// Test Event 10: Expected raw layer row data
export const constructAuthAuthorisationInitiatedTestEvent10ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'AUTH_AUTHORISATION_INITIATED',
    component_id: 'm1kw1pm464p4hcek2j8s',
    client_id: null,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: null,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions:
      '{"evidence":[{"checkdetails":[{"checkmethod":"0p7nl0a1","identitycheckpolicy":"published","biometricverificationprocesslevel":"2"}],"strengthscore":"4","type":"IdentityCheck","validityscore":"1","verificationscore":"2"}]}',
    txma: null,
    datecreated: datecreated,
  });

// Test Event 10: Expected stage layer row data
export const constructAuthAuthorisationInitiatedTestEvent10ExpectedStageLayerRow = (
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
    component_id: 'm1kw1pm464p4hcek2j8s',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: null,
    user_user_id: null,
    partition_event_name: 'AUTH_AUTHORISATION_INITIATED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'AUTH_AUTHORISATION_INITIATED',
  });

// Test Event 10: Expected stage layer key values data
export const constructAuthAuthorisationInitiatedTestEvent10ExpectedStageLayerKeyValues = (
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerKeyValues([
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'evidence[0].checkdetails[0].checkmethod',
      value: '0p7nl0a1',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'evidence[0].checkdetails[0].identitycheckpolicy',
      value: 'published',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'evidence[0].checkdetails[0].biometricverificationprocesslevel',
      value: '2',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'evidence[0].strengthscore',
      value: '4',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'evidence[0].type',
      value: 'IdentityCheck',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'evidence[0].validityscore',
      value: '1',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'evidence[0].verificationscore',
      value: '2',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
  ]);

// Test Event 10: Expected conformed layer data
export const constructAuthAuthorisationInitiatedTestEvent10ExpectedConformedData = (date: string) => ({
  fact: { event_id: event_id, component_id: 'm1kw1pm464p4hcek2j8s' },
  dimUserJourney: { user_govuk_signin_journey_id: null },
  dimEvent: {
    event_name: 'AUTH_AUTHORISATION_INITIATED',
  },
  dimJourneyChannel: {
    channel_name: 'General',
  },
  dimDate: {
    date: date,
  },
  extensions: [
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'evidence[0].checkdetails[0].biometricverificationprocesslevel',
      event_attribute_value: '2',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'evidence[0].checkdetails[0].checkmethod',
      event_attribute_value: '0p7nl0a1',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'evidence[0].checkdetails[0].identitycheckpolicy',
      event_attribute_value: 'published',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'evidence[0].strengthscore',
      event_attribute_value: '4',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'evidence[0].type',
      event_attribute_value: 'IdentityCheck',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'evidence[0].validityscore',
      event_attribute_value: '1',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'evidence[0].verificationscore',
      event_attribute_value: '2',
    },
  ],
});
