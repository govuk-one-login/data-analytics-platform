import {
  generateTimestamp,
  generateTimestampFormatted,
  generateTimestampInMs,
  generateDateCreatedPartition,
  generateProcessedDt,
  generateProcessedTime,
} from '../../helpers/utils/utils';
import {
  constructDCMAWAsyncBiometricTokenIssuedDAPEvent,
  constructDCMAWAsyncBiometricTokenIssuedExpectedRawLayerRow,
  constructDCMAWAsyncBiometricTokenIssuedExpectedStageLayerRow,
  constructDCMAWAsyncBiometricTokenIssuedExpectedStageLayerKeyValues,
} from './dcmaw-async-biometric-token-issued-dap-event';

const timestamp = generateTimestamp();
const timestamp_formatted = generateTimestampFormatted();
const event_timestamp_ms = generateTimestampInMs();
const event_timestamp_ms_formatted = generateTimestampFormatted();
const datecreated = generateDateCreatedPartition();
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const day = now.getDate();
const processed_dt = generateProcessedDt();
const processed_time = generateProcessedTime();

export const happyPathEventList = [
  {
    auditEvent: constructDCMAWAsyncBiometricTokenIssuedDAPEvent(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'testClientId',
      'testUserId',
      'testJourneyId',
    ),
    rawLayerEvent: constructDCMAWAsyncBiometricTokenIssuedExpectedRawLayerRow(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'testClientId',
      'testUserId',
      'testJourneyId',
      datecreated,
    ),
    stageLayerEvent: constructDCMAWAsyncBiometricTokenIssuedExpectedStageLayerRow(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'testClientId',
      'testUserId',
      'testJourneyId',
      year,
      month,
      day,
      processed_dt,
      processed_time,
    ),
    stageLayerKeyValues: constructDCMAWAsyncBiometricTokenIssuedExpectedStageLayerKeyValues(
      processed_dt,
      processed_time,
    ),
  },
];
