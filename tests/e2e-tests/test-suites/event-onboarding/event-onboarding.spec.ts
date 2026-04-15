import { eventOnboardingTestEvents } from '../../config/event-onboarding.config';
import { deriveExpected } from '../../helpers/utils/derive-expected';
import { queryConformLayer, printConformResults } from '../../helpers/utils/conform-layer-results';

interface SentEvent {
  event_id: string;
  eventConfig: (typeof eventOnboardingTestEvents)[number];
}

const getSentEvents = (): SentEvent[] => (global as { sentEvents?: SentEvent[] }).sentEvents || [];

describe('Event Onboarding E2E Tests', () => {
  for (const { event_id, eventConfig } of getSentEvents()) {
    const expected = deriveExpected(eventConfig, event_id, (global as { expectedDate?: string }).expectedDate || '');

    it(`${eventConfig.event_name} (${event_id})`, async () => {
      const result = await queryConformLayer(event_id);
      expect(result.row).toBeDefined();

      const mismatches = printConformResults(String(eventConfig.event_name), event_id, expected, result);
      expect(mismatches).toHaveLength(0);
    }, 30000);
  }
});
