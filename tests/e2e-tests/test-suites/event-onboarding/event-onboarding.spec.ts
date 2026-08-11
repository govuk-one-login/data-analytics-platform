import { readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { eventOnboardingTestEvents } from '../../config/event-onboarding.config';
import { deriveExpected } from '../../helpers/utils/derive-expected';
import { queryConformLayer, printConformResults } from '../../helpers/utils/conform-layer-results';

interface SentEvent {
  event_id: string;
  eventConfig: (typeof eventOnboardingTestEvents)[number];
}

interface SetupData {
  sentEvents: SentEvent[];
  expectedDate: string;
}

describe('Event Onboarding E2E Tests', () => {
  it('should find all sent events in the conform layer', async () => {
    const { sentEvents, expectedDate } = JSON.parse(
      readFileSync(join(tmpdir(), 'dap-event-onboarding-setup.json'), 'utf-8'),
    ) as SetupData;

    for (const { event_id, eventConfig } of sentEvents) {
      const expected = deriveExpected(eventConfig, event_id, expectedDate);
      const result = await queryConformLayer(event_id);
      expect(result.row).toBeDefined();

      const mismatches = printConformResults(String(eventConfig.event_name), event_id, expected, result);
      if (mismatches.length > 0) {
        throw new Error(`Mismatched fields for ${eventConfig.event_name} (${event_id}): ${mismatches.join(', ')}`);
      }
    }
  }, 30000);
});
