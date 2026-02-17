import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';

export const getReplayEventId = (): string => (global as { replayEventId?: string }).replayEventId!;
export const getReplayId = (): string => (global as { replayId?: string }).replayId!;
export const getReplayedTimestampMs = (): number => (global as { replayedTimestampMs?: number }).replayedTimestampMs!;

const event_id = randomUUID();
const replay_id = randomUUID();

export const constructReplayTestEvent = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'AUTH_MFA_METHOD_ADD_FAILED',
  client_id: 'testClientId',
  component_id: 'https://signin.account.gov.uk',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  user: {
    govuk_signin_journey_id: 'testJourneyId',
    user_id: 'testUserId',
  },
  extensions: {
    mfa_type: 'SMS',
    notification_type: 'MFA_SMS',
  },
});

export const constructReplayTestEventWithAdditionalExtensions = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  originalEventId?: string,
  originalTimestamp?: number,
  originalTimestampFormatted?: string,
): AuditEvent => {
  const replayed_timestamp_ms = Date.now();
  (global as { replayedTimestampMs?: number }).replayedTimestampMs = replayed_timestamp_ms;

  return {
    event_id: originalEventId || event_id,
    event_name: 'AUTH_MFA_METHOD_ADD_FAILED',
    client_id: 'testClientId',
    component_id: 'https://signin.account.gov.uk',
    timestamp: originalTimestamp || timestamp,
    timestamp_formatted: originalTimestampFormatted || timestamp_formatted,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    user: {
      govuk_signin_journey_id: 'testJourneyId',
      user_id: 'testUserId',
    },
    extensions: {
      mfa_type: 'SMS',
      notification_type: 'MFA_SMS',
      reason: 'INVALID_CODE',
    },
    txma: {
      event_replay: {
        replay_id: replay_id,
        replayed_timestamp_ms: replayed_timestamp_ms,
      },
      configversion: '1.1.74',
    },
  };
};

export const constructReplayTestEventExpectedConformedData = (eventId: string, date: string) => ({
  fact: {
    event_id: eventId,
    component_id: 'https://signin.account.gov.uk',
  },
  dimUserJourney: {
    user_govuk_signin_journey_id: 'testJourneyId',
  },
  dimEvent: {
    event_name: 'AUTH_MFA_METHOD_ADD_FAILED',
  },
  dimUser: {
    user_id: 'testUserId',
  },
  dimJourneyChannel: {
    channel_name: 'Web',
  },
  dimDate: {
    date: date,
  },
  extensions: [
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'mfa_type',
      event_attribute_value: 'SMS',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'notification_type',
      event_attribute_value: 'MFA_SMS',
    },
  ],
});

export const constructReplayTestEventExpectedConformedDataAfterReplay = (
  eventId: string,
  date: string,
  replayId: string,
  replayedTimestampMs: string,
) => ({
  fact: {
    event_id: eventId,
    component_id: 'https://signin.account.gov.uk',
  },
  dimUserJourney: {
    user_govuk_signin_journey_id: 'testJourneyId',
  },
  dimEvent: {
    event_name: 'AUTH_MFA_METHOD_ADD_FAILED',
  },
  dimUser: {
    user_id: 'testUserId',
  },
  dimJourneyChannel: {
    channel_name: 'Web',
  },
  dimDate: {
    date: date,
  },
  extensions: [
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'mfa_type',
      event_attribute_value: 'SMS',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'notification_type',
      event_attribute_value: 'MFA_SMS',
    },
    {
      parent_attribute_name: 'extensions',
      event_attribute_name: 'reason',
      event_attribute_value: 'INVALID_CODE',
    },
    {
      parent_attribute_name: 'txma',
      event_attribute_name: 'configversion',
      event_attribute_value: '1.1.74',
    },
    {
      parent_attribute_name: 'txma',
      event_attribute_name: 'event_replay.replay_id',
      event_attribute_value: replayId,
    },
    {
      parent_attribute_name: 'txma',
      event_attribute_name: 'event_replay.replayed_timestamp_ms',
      event_attribute_value: replayedTimestampMs,
    },
  ],
});
