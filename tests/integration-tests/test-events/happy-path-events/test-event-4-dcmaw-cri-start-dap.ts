import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';

const event_id = randomUUID();

export const constructDCMAWCriStartTestEvent4 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  client_id: string,
  journey_id: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'DCMAW_CRI_START',
  client_id: client_id,
  component_id: '106sdhzkl1rus2fcuj2w',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  user: {
    govuk_signin_journey_id: journey_id,
  },
});

// Test Event 4: Expected raw layer row data
export const constructDCMAWCriStartTestEvent4ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  client_id: string,
  journey_id: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'DCMAW_CRI_START',
    component_id: '106sdhzkl1rus2fcuj2w',
    client_id: client_id,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: `{"govuk_signin_journey_id":"${journey_id}"}`,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions: null,
    txma: null,
    datecreated: datecreated,
  });

// Test Event 4: Expected stage layer row data
export const constructDCMAWCriStartTestEvent4ExpectedStageLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  client_id: string,
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
    component_id: '106sdhzkl1rus2fcuj2w',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: journey_id,
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

// Test Event 4: Expected stage layer key values data
export const constructDCMAWCriStartTestEvent4ExpectedStageLayerKeyValues = () => undefined;
