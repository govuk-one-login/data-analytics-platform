import { AuditEvent } from '../../../common/types/event';
import { randomUUID } from 'node:crypto';
import { EventOnboardingTestEvent } from '../config/event-onboarding.config';

export const constructTestEvent = (event: EventOnboardingTestEvent): AuditEvent => {
  const now = Date.now();
  return {
    ...event,
    event_id: randomUUID(),
    timestamp: Math.floor(now / 1000),
    event_timestamp_ms: now,
  } as unknown as AuditEvent;
};
