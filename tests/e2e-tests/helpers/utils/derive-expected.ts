import { EventOnboardingTestEvent } from '../../config/event-onboarding.config';

export interface ExpectedConformData {
  event_id: string;
  component_id: string;
  event_name: string;
  user_govuk_signin_journey_id: string;
  date: string;
}

export const deriveExpected = (
  event: EventOnboardingTestEvent,
  eventId: string,
  expectedDate: string,
): ExpectedConformData => {
  const user = event.user as { govuk_signin_journey_id?: string } | undefined;

  return {
    event_id: eventId,
    component_id: String(event.component_id ?? ''),
    event_name: String(event.event_name),
    user_govuk_signin_journey_id: user?.govuk_signin_journey_id || '',
    date: expectedDate,
  };
};
