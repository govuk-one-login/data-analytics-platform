/**
 * RP Onboarding E2E Test Configuration
 *
 * TO TEST A SINGLE RP:
 * Update the clientId and expected values in the existing entry below.
 *
 * TO TEST MULTIPLE RPs AT ONCE:
 * Add another entry to the rpOnboardingTestEvents array before the closing ].
 * Copy and paste the example below:
 *
 *   {
 *     clientId: 'your-client-id',
 *     expectedDimRelyingParty: {
 *       department_name: '...',
 *       relying_party_name: '...',
 *       agency_name: '...',
 *       display_name: '...',
 *     },
 *     expectedRefRelyingParties: {
 *       department_name: '...',
 *       client_name: '...',
 *       agency_name: '...',
 *       display_name: '...',
 *     },
 *   },
 */

export interface RpOnboardingTestEvent {
  clientId: string;
  expectedDimRelyingParty: {
    department_name: string;
    relying_party_name: string;
    agency_name: string;
    display_name: string;
  };
  expectedRefRelyingParties: {
    department_name: string;
    client_name: string;
    agency_name: string;
    display_name: string;
  };
}

export const rpOnboardingTestEvents: RpOnboardingTestEvent[] = [
  // ──── Event 1 ────
  {
    clientId: 'sXr5F6w5QytPPJN-Dtsgbl6hegQ',
    expectedDimRelyingParty: {
      department_name: 'HO',
      relying_party_name: 'Foreign Influence Registration Scheme',
      agency_name: 'HSG',
      display_name: 'HO - Foreign Influence Registration Scheme',
    },
    expectedRefRelyingParties: {
      department_name: 'HO',
      client_name: 'Foreign Influence Registration Scheme',
      agency_name: 'HSG',
      display_name: 'HO - Foreign Influence Registration Scheme',
    },
  },
  // ──── Add new events below this line ────
];
