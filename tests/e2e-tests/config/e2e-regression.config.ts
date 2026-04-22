/**
 * E2E Regression Test Configuration
 *
 * This test sends a raw event through the full pipeline and verifies it lands
 * correctly in the conform layer. event_id, timestamp and event_timestamp_ms
 * are generated automatically at send time.
 *
 * The `expected` block defines values that are transformed or derived by the
 * pipeline (e.g. channel_name is derived, extension keys are lowercased).
 * Fields that pass through unchanged (event_name, component_id, etc.) are
 * asserted directly from the input event.
 */

import { AuditEvent } from '../../../common/types/event';

export interface ExpectedConformValues {
  channel_name: string;
  client_id: string;
  extensions: { parent_attribute_name: string; event_attribute_name: string; event_attribute_value: string }[];
}

export interface RegressionTestConfig {
  event: Omit<AuditEvent, 'event_id' | 'timestamp'>;
  expected: ExpectedConformValues;
}

export const regressionTestConfig: RegressionTestConfig = {
  event: {
    event_name: 'DCMAW_ASYNC_BIOMETRIC_TOKEN_ISSUED',
    client_id: 'sXr5F6w5QytPPJN-Dtsgbl6hegQ',
    component_id: 'https://review-b-async.staging.account.gov.uk',
    user: {
      govuk_signin_journey_id: 'e2e-regression-journey-id',
      session_id: 'e2e-regression-session-id',
      user_id: 'urn:uuid:e2e-regression-user-id',
    },
    extensions: {
      documentType: 'NFC_PASSPORT',
    },
  },
  expected: {
    channel_name: 'App',
    client_id: 'sXr5F6w5QytPPJN-Dtsgbl6hegQ',
    extensions: [
      {
        parent_attribute_name: 'extensions',
        event_attribute_name: 'documenttype',
        event_attribute_value: 'NFC_PASSPORT',
      },
    ],
  },
};
