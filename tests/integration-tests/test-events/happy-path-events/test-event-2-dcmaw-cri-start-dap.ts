import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';

const event_id = randomUUID();

export const constructDCMAWCriStartTestEvent2 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'DCMAW_CRI_START',
  component_id: '106sdhzkl1rus2fcuj2w',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
});

// Test Event 2: Expected raw layer row data
export const constructDCMAWCriStartTestEvent2ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'DCMAW_CRI_START',
    component_id: '106sdhzkl1rus2fcuj2w',
    client_id: null,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: null,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions: null,
    txma: null,
    datecreated: datecreated,
  });

// Test Event 2: Expected stage layer row data
export const constructDCMAWCriStartTestEvent2ExpectedStageLayerRow = (
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
    component_id: '106sdhzkl1rus2fcuj2w',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: null,
    user_user_id: null,
    partition_event_name: 'DCMAW_CRI_START',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'DCMAW_CRI_START',
  });

// Test Event 2: Expected stage layer key values data
export const constructDCMAWCriStartTestEvent2ExpectedStageLayerKeyValues = () => undefined;

// Test Event 2: Expected conformed layer data
export const constructDCMAWCriStartTestEvent2ExpectedConformedData = (date: string) => ({
  fact: {
    event_id: event_id,
    component_id: '106sdhzkl1rus2fcuj2w',
  },
  dimUserJourney: {
    user_govuk_signin_journey_id: null,
  },
  dimEvent: {
    event_name: 'DCMAW_CRI_START',
  },
  dimJourneyChannel: {
    channel_name: 'App',
  },
  dimDate: {
    date: date,
  },
  extensions: [],
});
