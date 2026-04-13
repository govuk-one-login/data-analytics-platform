/**
 * Event Onboarding E2E Test Configuration
 *
 * This test sends full raw events through the pipeline and verifies they land
 * correctly in the conform layer. Events are sent exactly as provided (with an
 * auto-generated event_id added), so you can validate that fields like extensions
 * are correctly included or excluded by the pipeline.
 *
 * TO TEST A NEW EVENT TYPE:
 * Add the full raw event payload to the eventOnboardingTestEvents array below.
 * event_id, timestamp and event_timestamp_ms will be added automatically.
 *
 * The test asserts the following fields in the conform layer, derived from the event:
 * - component_id from event.component_id
 * - event_name from event.event_name
 * - user_govuk_signin_journey_id from event.user.govuk_signin_journey_id
 * - user_id from event.user.user_id
 * - date from the date the test is run
 *
 * The test also prints (without asserting) the channel_name and any extensions
 * found in the conform layer for visibility.
 */

import { AuditEvent } from '../../../common/types/event';

export type EventOnboardingTestEvent = Omit<AuditEvent, 'event_id' | 'timestamp'>;

export const eventOnboardingTestEvents: EventOnboardingTestEvent[] = [
  // ──── Example event ────
  // {
  //   event_name: 'YOUR_EVENT_NAME',
  //   component_id: 'https://your-component-id',
  //   extensions: {
  //     some_field: 'some_value',
  //   },
  //   user: {
  //     user_id: 'urn:uuid:your-user-id',
  //     govuk_signin_journey_id: 'your-journey-id',
  //   },
  // },
  // ──── Add new events below this line ────
];
