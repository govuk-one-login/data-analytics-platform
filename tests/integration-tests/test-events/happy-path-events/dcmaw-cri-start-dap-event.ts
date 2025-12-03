import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';

const event_id = randomUUID();

export const constructDCMAWCriStartEvent = (timestamp: number, event_timestamp_ms: number): AuditEvent => ({
  event_id: event_id,
  event_name: 'DCMAW_CRI_START',
  component_id: '106sdhzkl1rus2fcuj2w',
  timestamp: timestamp,
  event_timestamp_ms: event_timestamp_ms,
});

// Expected raw layer row data based on actual query results
export const constructDCMAWCriStartExpectedRawLayerRow = (
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
    client_id: 'null',
    timestamp: timestamp,
    timestamp_formatted,
    user: `null`,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted,
    extensions: 'null',
    txma: 'null',
    datecreated: datecreated,
  });

// Expected stage layer row data
export const constructDCMAWCriStartExpectedExpectedStageLayerRow = (
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
    client_id: 'null',
    component_id: '106sdhzkl1rus2fcuj2w',
    timestamp: timestamp,
    timestamp_formatted,
    user_govuk_signin_journey_id: journey_id,
    user_user_id: user_id,
    partition_event_name: 'DCMAW_CRI_START',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'DCMAW_CRI_START',
  });

// Expected stage layer key values data
export const constructDCMAWCriStartExpectedStageLayerKeyValues = (processed_dt: number, processed_time: number) => [];
