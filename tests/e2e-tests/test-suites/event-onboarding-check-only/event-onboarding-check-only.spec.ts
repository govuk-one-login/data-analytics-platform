import { queryConformLayerByEventName, printConformCheckOnly } from '../../helpers/utils/conform-layer-results';

const getEventNames = (): string[] => (global as { checkOnlyEventNames?: string[] }).checkOnlyEventNames || [];

describe('Event Onboarding E2E Tests (check only)', () => {
  for (const eventName of getEventNames()) {
    it(`should find conform layer data for ${eventName}`, async () => {
      const result = await queryConformLayerByEventName(eventName);
      printConformCheckOnly(eventName, result);
      expect(result.row).toBeDefined();
    }, 30000);
  }
});
