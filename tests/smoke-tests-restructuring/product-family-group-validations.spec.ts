// Validate Product Based Grouping in Stage Layer
import * as fs from 'fs';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import { txmaProcessingWorkGroupName, txmaStageDatabaseName } from '../helpers/envHelper';
import { productFamily } from '../helpers/common-helpers';
import { DISTINCT_EVENT_NAME, EVENT_BY_FAMILY } from '../helpers/query-constant';

// verify grouping is done as defined in https://docs.google.com/spreadsheets/d/1U_WNH5nCxtc1UOhooCUS54aO6e-xaqxW4jvgVt-jNNQ/edit#gid=1517871112

const data = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));

describe('Verify product family mapping in Stage Layer ', () => {
  // ******************** Copy files to s3 raw bucket ************************************

  test('Verify product family is mapped to the correct event in Stage Layer', async () => {
    for (let index = 0; index <= data.length - 1; index++) {
      const productFamilyGroupName = productFamily(data[index]);
      const athenaQueryResults = await getQueryResults(
        DISTINCT_EVENT_NAME + String(productFamilyGroupName),
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      expect(JSON.stringify(athenaQueryResults)).toContain(String(data[index]));
    }
  }, 120000);
  test.concurrent.each`
    family_name                           | service_name
    ${'AUTH_ORCHESTRATION'}               | ${'Relying Parties Connect'}
    ${'AUTH_ACCOUNT_USER_LOGIN'}          | ${'User Login'}
    ${'AUTH_ACCOUNT_CREATION'}            | ${'Account Creation'}
    ${'AUTH_ACCOUNT_MFA'}                 | ${'Account MFA'}
    ${'AUTH_ACCOUNT_MANAGEMENT'}          | ${'Account Management'}
    ${'IPV_CRI_DRIVING_LICENSE'}          | ${'Driving License'}
    ${'IPV_CRI_ADDRESS'}                  | ${'Address CRI'}
    ${'IPV_CRI_FRAUD'}                    | ${'Fraud CRI'}
    ${'IPV_CRI_KBV'}                      | ${'KBV CRI'}
    ${'IPV_JOURNEY'}                      | ${'IPV Journey'}
    ${'IPV_CRI_PASSPORT'}                 | ${'Passport CRI'}
    `(
    'Should validate fact table records as per the  product family grouping $family_name',
    async ({ ...data }) => {
      // given
      const expectedEvent = JSON.parse(
        fs.readFileSync('tests/data/event/' + (data.family_name as string).toLowerCase() + '_family.json', 'utf-8'),
      );
      for (let index = 0; index <= expectedEvent.length - 1; index++) {
        const query =
          EVENT_BY_FAMILY +
          "'" +
          (data.family_name as string) +
          "' and de.event_name='" +
          (expectedEvent[index] as string) +
          "'";
        const redShiftQueryResults = await redshiftRunQuery(query);
        // console.log('Data:' + JSON.stringify(redShiftQueryResults));
        expect(redShiftQueryResults.TotalNumRows).toBeGreaterThan(1);
        if (redShiftQueryResults.Records != null) {
          for (let index = 0; index <= redShiftQueryResults.Records.length - 1; index++) {
            expect(data.service_name.toLowerCase()).toEqual(
              redShiftQueryResults.Records[index][3].stringValue.toLowerCase(),
            );
          }
        }
      }
    },
    240000,
  );
});
