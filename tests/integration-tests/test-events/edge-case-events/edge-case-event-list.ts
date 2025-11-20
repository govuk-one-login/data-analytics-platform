import {
  generateTimestamp,
  generateTimestampFormatted,
  generateTimestampInMs,
  generateProcessedDt,
  generateProcessedTime,
} from '../../helpers/utils/utils';
import { constructCreateAccountEmptyClientIdEvent } from './empty-client-id-event';
import {
  constructDCMAWNullFieldsEvent,
  constructDCMAWNullFieldsExpectedStageLayerKeyValues,
} from './null-extension-fields-event';

const timestamp = generateTimestamp();
const timestamp_formatted = generateTimestampFormatted();
const event_timestamp_ms = generateTimestampInMs();
const event_timestamp_ms_formatted = generateTimestampFormatted();
const processed_dt = generateProcessedDt();
const processed_time = generateProcessedTime();

export const edgeCaseEventList = [
  {
    eventType: 'NullExtensionTxMAFieldsEvent',
    auditEvent: constructDCMAWNullFieldsEvent(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'testClientId',
      'testUserId',
      'testJourneyId',
    ),
    stageLayerKeyValues: constructDCMAWNullFieldsExpectedStageLayerKeyValues(processed_dt, processed_time),
  },
  {
    eventType: 'EmptyClientIdEvent',
    auditEvent: constructCreateAccountEmptyClientIdEvent(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      '',
      'testUserId',
      'testJourneyId',
    ),
  },
];
