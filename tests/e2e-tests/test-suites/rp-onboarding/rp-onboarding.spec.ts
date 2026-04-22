import { executeRedshiftQuery } from '../../../shared-test-code/aws/redshift/execute-redshift-query';
import { rpOnboardingTestEvents } from '../../config/rp-onboarding.config';
import { printResults } from '../../helpers/utils/print-results';

const hasMatch = (expected: Record<string, string>, actual: Record<string, string | number>[]) =>
  actual.some(row => Object.entries(expected).every(([key, value]) => String(row[key]) === value));

describe('RP Onboarding E2E Tests', () => {
  for (const testEvent of rpOnboardingTestEvents) {
    describe(`client_id: ${testEvent.clientId}`, () => {
      it('should have the correct entry in dim_relying_party_refactored', async () => {
        // End-to-end Test
        const results = await executeRedshiftQuery(
          `SELECT client_id, department_name, relying_party_name, agency_name, display_name
           FROM conformed_refactored.dim_relying_party_refactored
           WHERE client_id = '${testEvent.clientId}'`,
        );

        const expected = { client_id: testEvent.clientId, ...testEvent.expectedDimRelyingParty };
        printResults('dim_relying_party_refactored', expected, results);
        expect(hasMatch(expected, results)).toBe(true);
      });

      it('should have the correct entry in ref_relying_parties_refactored', async () => {
        // End-to-end Test
        const results = await executeRedshiftQuery(
          `SELECT client_id, department_name, client_name, agency_name, display_name
           FROM conformed_refactored.ref_relying_parties_refactored
           WHERE client_id = '${testEvent.clientId}'`,
        );

        const expected = { client_id: testEvent.clientId, ...testEvent.expectedRefRelyingParties };
        printResults('ref_relying_parties_refactored', expected, results);
        expect(hasMatch(expected, results)).toBe(true);
      });
    });
  }
});
