import { generateTimestamp, generateTimestampFormatted, generateTimestampInMs } from '../../helpers/utils/utils';
import { constructNoEventNameFieldEvent } from './no-event-name-field-event';
import { constructNoTimestampFieldEvent } from './no-timestamp-field-event';
import { constructTimestampAsStringEvent } from './timestamp-as-string-event';
import { constructTimestampInMsEvent } from './timestamp-in-ms-event';

const timestamp = generateTimestamp();
const timestamp_formatted = generateTimestampFormatted();
const event_timestamp_ms = generateTimestampInMs();
const event_timestamp_ms_formatted = generateTimestampFormatted();

export const txmaUnhappyPathEventList = [
  {
    eventType: 'NoEventNameField',
    auditEvent: constructNoEventNameFieldEvent(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'testClientId',
      'testUserId',
      'testJourneyId',
    ),
  },
  {
    eventType: 'NoTimestampField',
    auditEvent: constructNoTimestampFieldEvent(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'testClientId',
      'testUserId',
      'testJourneyId',
    ),
  },
  {
    eventType: 'TimestampAsString',
    auditEvent: constructTimestampAsStringEvent(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'testClientId',
      'testUserId',
      'testJourneyId',
    ),
  },
  {
    eventType: 'TimestampInMs',
    auditEvent: constructTimestampInMsEvent(
      timestamp,
      timestamp_formatted,
      event_timestamp_ms,
      event_timestamp_ms_formatted,
      'testClientId',
      'testUserId',
      'testJourneyId',
    ),
  },
];
