import { createHmac } from 'node:crypto';
import { queryConformLayer, printConformResultsFull } from '../../helpers/utils/conform-layer-results';
import { regressionTestConfig } from '../../config/e2e-regression.config';

const getEventId = (): string => (global as { regressionEventId?: string }).regressionEventId || '';
const getExpectedDate = (): string => (global as { regressionExpectedDate?: string }).regressionExpectedDate || '';
const getHmacKey = (): string => (global as { regressionHmacKey?: string }).regressionHmacKey || '';
const getSetupDuration = (): number =>
  (global as { regressionSetupDurationMs?: number }).regressionSetupDurationMs || 0;
const getEventTimestampMs = (): number =>
  (global as { regressionEventTimestampMs?: number }).regressionEventTimestampMs || 0;

const { event, expected } = regressionTestConfig;
const user = event.user as { user_id: string; govuk_signin_journey_id: string };

describe('E2E Regression Tests', () => {
  it(`${event.event_name}`, async () => {
    // End-to-end Test
    const testStart = Date.now();
    const eventId = getEventId();
    const result = await queryConformLayer(eventId);
    expect(result.row).toBeDefined();

    const expectedConform = {
      event_id: eventId,
      component_id: String(event.component_id),
      event_name: String(event.event_name),
      user_govuk_signin_journey_id: user.govuk_signin_journey_id,
      date: getExpectedDate(),
      user_id: createHmac('sha256', getHmacKey()).update(user.user_id).digest('hex'),
      channel_name: expected.channel_name,
      client_id: expected.client_id,
      event_timestamp_ms: String(getEventTimestampMs()),
      extensions: expected.extensions,
    };

    const mismatches = printConformResultsFull(String(event.event_name), eventId, expectedConform, result, {
      setupDurationMs: getSetupDuration(),
      testDurationMs: Date.now() - testStart,
    });
    if (mismatches.length > 0) {
      throw new Error(`Mismatched fields: ${mismatches.join(', ')}`);
    }
  }, 30000);
});
