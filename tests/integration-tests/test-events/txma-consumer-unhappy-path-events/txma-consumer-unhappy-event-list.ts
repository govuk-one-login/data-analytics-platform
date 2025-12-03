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
    description: 'Event with no event_name field',
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
    description: 'Event with no timestamp field',
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
    description: 'Event with timestamp as string',
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
    description: 'Event with timestamp in milliseconds',
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
