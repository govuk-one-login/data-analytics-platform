import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const STATE_DIR = join(__dirname, '..', '..', '.state');
const STATE_FILE = join(STATE_DIR, 'global-setup-state.json');

export interface SharedState {
  testEventPairs: unknown[];
  edgeCaseEventPairs: unknown[];
  unhappyPathEventPairs: unknown[];
  testEvents: unknown[];
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
