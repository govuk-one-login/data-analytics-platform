import { faker } from '@faker-js/faker';
import { getQueryResults } from '../helpers/db-helpers';
import { AUTH_ACCOUNT_MFA_DATA, GET_EVENT_ID, extensionsnotnullquery } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, extensionToMap } from '../helpers/common-helpers';

describe('AUTH_CODE_VERIFIED GROUP Test - validate data at stage layer', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_CODE_VERIFIED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event extensions  stored in raw and stage layer',
    async ({ ...data }) => {
      // given
      const eventname = data.eventName;
      const eventidresults = await getQueryResults(
        GET_EVENT_ID(eventname),
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );

      const querystring = eventidlist(eventidresults);
      const query = `${extensionsnotnullquery(eventname)} and event_id in (${querystring})`;
      const athenaQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      for (let index = 0; index <= athenaQueryResults.length - 1; index++) {
        const eventId = athenaQueryResults[index].event_id;
        const stExtensions = athenaQueryResults[index].extensions;
        const data = extensionToMap(stExtensions);
        const queryStage = `${AUTH_ACCOUNT_MFA_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log(queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        // console.log('queryStage' + JSON.stringify(athenaQueryResultsStage));
        if (data.mfa_type !== 'null' && data.mfa_type !== null && data.mfa_type !== undefined) {
          const mfatype = athenaQueryResultsStage[0].extensions_mfatype.replaceAll('"', '');
          // console.log('Athena Data--> ' + athenaQueryResultsStage[0].extensions_mfatype);
          expect(data.mfa_type).toEqual(mfatype);
        }
        if (data.account_recovery !== 'null' && data.account_recovery !== null && data.account_recovery !== undefined) {
          const accountRecovery = athenaQueryResultsStage[0].extensions_accountrecovery.replaceAll('"', '');
          expect(data.account_recovery).toEqual(accountRecovery);
        }
        if (
          data.notification_type !== 'null' &&
          data.notification_type !== null &&
          data.notification_type !== undefined
        ) {
          const notificationType = athenaQueryResultsStage[0].extensions_notificationtype.replaceAll('"', '');
          // console.log(athenaQueryResultsStage[0].extensions_mfatype);
          // console.log('Map--> ' + data['notification-type']);
          expect(data.notification_type).toEqual(notificationType);
        }
      }
    },
    240000,
  );
});