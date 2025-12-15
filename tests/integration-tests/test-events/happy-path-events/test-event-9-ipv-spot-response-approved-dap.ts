import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';
import { buildExpectedStageLayerKeyValues } from '../../helpers/builders/stage-layer-key-values-builder';

const event_id = randomUUID();

export const constructIpvSpotResponseApprovedTestEvent9 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'IPV_SPOT_RESPONSE_APPROVED',
  component_id: '97yng2ww2jml3tnyl3hx',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  extensions: {
    crosscore_request_reference: '16dd705a-d206-44ac-a36c-d1d67f4705f0',
    decision: 'CONTINUE',
    journey_type: 'REGISTRATION',
    emailFraudCheckResponse: {
      decision: {
        decision: 'CONTINUE',
        decisionReasons: ['Low or No email Risk'],
        fraudRisk: '150 Low',
        score: 273,
      },
      domain: {
        countryName: 'United Kingdom',
        exists: 'Yes',
        riskLevel: 'Low',
      },
      email: {
        country: 'GB',
        exists: 'Yes',
        status: 'Verified',
      },
    },
  },
});

// Test Event 9: Expected raw layer row data
export const constructIpvSpotResponseApprovedTestEvent9ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'IPV_SPOT_RESPONSE_APPROVED',
    component_id: '97yng2ww2jml3tnyl3hx',
    client_id: null,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: null,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions:
      '{"crosscore_request_reference":"16dd705a-d206-44ac-a36c-d1d67f4705f0","decision":"CONTINUE","journey_type":"REGISTRATION","emailfraudcheckresponse":{"decision":{"decision":"CONTINUE","decisionreasons":["Low or No email Risk"],"fraudrisk":"150 Low","score":"273"},"domain":{"countryname":"United Kingdom","exists":"Yes","risklevel":"Low"},"email":{"country":"GB","exists":"Yes","status":"Verified"}}}',
    txma: null,
    datecreated: datecreated,
  });

// Test Event 9: Expected stage layer row data
export const constructIpvSpotResponseApprovedTestEvent9ExpectedStageLayerRow = (
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
    component_id: '97yng2ww2jml3tnyl3hx',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: null,
    user_user_id: null,
    partition_event_name: 'IPV_SPOT_RESPONSE_APPROVED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'IPV_SPOT_RESPONSE_APPROVED',
  });

// Test Event 9: Expected stage layer key values data
export const constructIpvSpotResponseApprovedTestEvent9ExpectedStageLayerKeyValues = (
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerKeyValues([
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'crosscore_request_reference',
      value: '16dd705a-d206-44ac-a36c-d1d67f4705f0',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'decision',
      value: 'CONTINUE',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'journey_type',
      value: 'REGISTRATION',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.decision.decision',
      value: 'CONTINUE',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.decision.decisionreasons[0]',
      value: 'Low or No email Risk',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.decision.fraudrisk',
      value: '150 Low',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.decision.score',
      value: '273',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.domain.countryname',
      value: 'United Kingdom',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.domain.exists',
      value: 'Yes',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.domain.risklevel',
      value: 'Low',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.email.country',
      value: 'GB',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.email.exists',
      value: 'Yes',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
    {
      event_id: event_id,
      parent_column_name: 'extensions',
      key: 'emailfraudcheckresponse.email.status',
      value: 'Verified',
      processed_time: processed_time,
      processed_dt: processed_dt,
    },
  ]);
