import { randomUUID } from 'crypto';
import { generateTimestamp, generateTimestampFormatted, generateTimestampInMs } from '../helpers/utils/utils';
import { constructDCMAWAsyncBiometricTokenIssuedDAPEvent } from './DCMAWAsyncBiometricTokenIssuedDAPEvent';

const timestamp = generateTimestamp();
const timestamp_formatted = generateTimestampFormatted();
const event_timestamp_ms = generateTimestampInMs();
const event_timestamp_ms_formatted = generateTimestampFormatted();

export const happyPathEventList = [
  constructDCMAWAsyncBiometricTokenIssuedDAPEvent(
    randomUUID(),
    timestamp,
    timestamp_formatted,
    event_timestamp_ms,
    event_timestamp_ms_formatted,
    'e2eTestClientId',
    'e2eTestCommonSubjectId',
    'journeyId',
  ),
];
