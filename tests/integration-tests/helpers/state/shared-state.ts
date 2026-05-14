import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Row } from '@aws-sdk/client-athena';

const STATE_DIR = join(__dirname, '..', '..', '.state');
const STATE_FILE = join(STATE_DIR, 'global-setup-state.json');

export interface EventPair {
  testEventNumber: number;
  auditEvent: { event_id: string; event_name: string; [key: string]: unknown };
  rawLayerEvent: Row[];
  stageLayerEvent: Row[];
  stageLayerKeyValues?: Row[];
  conformedEvent: {
    fact: { event_id: string; component_id: string };
    dimUserJourney: { user_govuk_signin_journey_id: string | null };
    extensions: { parent_attribute_name: string; event_attribute_name: string; event_attribute_value: string }[];
    dimEvent: { event_name: string };
    dimUser?: { user_id: string };
    dimJourneyChannel: { channel_name: string };
    dimDate: { date: string };
  };
}

export interface EdgeCaseEventPair {
  eventType: string;
  auditEvent: { event_id: string; event_name: string; [key: string]: unknown };
  stageLayerEvent?: Row[];
  stageLayerKeyValues?: Row[];
}

export interface SharedState {
  testEventPairs: EventPair[];
  edgeCaseEventPairs: EdgeCaseEventPair[];
  unhappyPathEventPairs: { description: string; auditEvent: unknown }[];
  testEvents: { event_id: string; [key: string]: unknown }[];
  replayEventId: string;
  deduplicationEventId: string;
  deduplicationTimestamps: string[];
}

export const writeSharedState = (state: SharedState): void => {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state));
};

export const readSharedState = (): SharedState => {
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
};
