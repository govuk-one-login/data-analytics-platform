import { faker } from '@faker-js/faker';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import {
  AUTH_ACCOUNT_MFA_DATA,
  GET_EVENT_ID,
  IPV_IDENTITY_ISSUED_CONFORMED,
  extensionsnotnullquery,
} from '../helpers/query-constant';
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
        const dataExtensions = extensionToMap(stExtensions);
        const queryStage = `${AUTH_ACCOUNT_MFA_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log(queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        // console.log('queryStage' + JSON.stringify(athenaQueryResultsStage));
        if (
          dataExtensions.mfa_type !== 'null' &&
          dataExtensions.mfa_type !== null &&
          dataExtensions.mfa_type !== undefined
        ) {
          const mfatype = athenaQueryResultsStage[0].extensions_mfatype.replaceAll('"', '');
          // console.log('Athena Data--> ' + athenaQueryResultsStage[0].extensions_mfatype);
          expect(dataExtensions.mfa_type).toEqual(mfatype);
        }
        if (
          dataExtensions.account_recovery !== 'null' &&
          dataExtensions.account_recovery !== null &&
          dataExtensions.account_recovery !== undefined
        ) {
          const accountRecovery = athenaQueryResultsStage[0].extensions_accountrecovery.replaceAll('"', '');
          expect(dataExtensions.account_recovery).toEqual(accountRecovery);
        }
        if (
          dataExtensions.notification_type !== 'null' &&
          dataExtensions.notification_type !== null &&
          dataExtensions.notification_type !== undefined
        ) {
          const notificationType = athenaQueryResultsStage[0].extensions_notificationtype.replaceAll('"', '');
          // console.log('Map--> ' + data['notification-type']);
          expect(dataExtensions.notification_type).toEqual(notificationType);
        }
        const queryRedShift = `${IPV_IDENTITY_ISSUED_CONFORMED} event_id = '${eventId}'`;
        const redShiftQueryResults = await redshiftRunQuery(queryRedShift);
        for (let index = 0; index <= redShiftQueryResults.Records.length - 1; index++) {
          if (dataExtensions.notification_type != null) {
            if (
              dataExtensions.notification_type !== 'null' &&
              dataExtensions.notification_type !== null &&
              dataExtensions.notification_type !== undefined
            ) {
              const notificationType = redShiftQueryResults.Records[index][5].stringValue;
              expect(dataExtensions.notification_type.toString()).toEqual(notificationType);
            }
            if (
              dataExtensions.account_recovery !== 'null' &&
              dataExtensions.account_recovery !== null &&
              dataExtensions.account_recovery !== undefined
            ) {
              const accountRecovery = redShiftQueryResults.Records[index][6].stringValue;
              expect(dataExtensions.account_recovery).toEqual(accountRecovery);
            }
            if (
              dataExtensions.mfa_type !== 'null' &&
              dataExtensions.mfa_type !== null &&
              dataExtensions.mfa_type !== undefined
            ) {
              const mfaType = redShiftQueryResults.Records[index][7].stringValue;
              expect(dataExtensions.mfa_type.toString()).toEqual(mfaType);
            }
          }
        }
      }
    },
    240000,
  );
});
