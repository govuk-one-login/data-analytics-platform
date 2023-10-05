import { faker } from '@faker-js/faker';
import { getQueryResults } from '../helpers/db-helpers';
import { AUTH_ACCOUNT_MFA_DATA, AUTH_CODE_VERIFIED_DATA } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { extentionToMap, month, year } from '../helpers/common-helpers';

describe('AUTH_CODE_VERIFIED GROUP Test - validate data at stage layer', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_CODE_VERIFIED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event extensions  stored in raw and stage layer',
    async ({ ...data }) => {
      // given
      const query = `${AUTH_CODE_VERIFIED_DATA} and month = '${month(3)}' and year = '${year(
        1,
      )}' order by day desc limit 10`;
      // console.log(query);
      const athenaQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      // console.log(JSON.stringify(athenaQueryResults));
      for (let index = 0; index <= athenaQueryResults.length - 1; index++) {
        const eventId = athenaQueryResults[index].event_id;
        const stExtensions = athenaQueryResults[index].extensions;
        const data = extentionToMap(stExtensions);
        // console.log(data);
        const queryStage = `${AUTH_ACCOUNT_MFA_DATA} and event_id = '${eventId}'`;
        // console.log(queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        // console.log('queryStage' + JSON.stringify(athenaQueryResultsStage));
        if (data['mfa_type'] !== 'null' && data['mfa_type'] !== null && data['mfa_type'] !== undefined) {
          // console.log('Map--> "' + data['mfa_type']);
          expect(`"${data['mfa_type']}"`).toEqual(athenaQueryResultsStage[0].extensions_mfatype);
        }
        if (
          data['account-recovery'] !== 'null' &&
          data['account-recovery'] !== null &&
          data['account-recovery'] !== undefined
        ) {
          expect(`"${data['account-recovery']}"`).toEqual(athenaQueryResultsStage[0].extensions_accountrecovery);
        }
        if (
          data['notification-type'] !== 'null' &&
          data['notification-type'] !== null &&
          data['notification-type'] !== undefined
        ) {
          // console.log(athenaQueryResultsStage[0].extensions_mfatype);
          // console.log('Map--> ' + data['notification-type']);
          expect(data['notification-type']).toEqual(athenaQueryResultsStage[0].extensions_notificationtype);
        }
      }
    },
    240000,
  );
});
