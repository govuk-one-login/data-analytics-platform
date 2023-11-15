import { faker } from '@faker-js/faker';
import { getQueryResults } from '../helpers/db-helpers';
import { GET_EVENT_ID, extensionsnotnullquery, IPV_CRI_F2F_DATA, usernotnullquery } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, parseData } from '../helpers/common-helpers';

describe('F2F_CRI_AUTH_CODE_ISSUED data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'F2F_CRI_AUTH_CODE_ISSUED'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
  `(
    'Should validate $eventName event extensions  stored in raw and stage layer',
    async ({ ...data }) => {
      // given
      const eventname = data.eventName;
      // console.log('Query: ' + JSON.stringify(GET_EVENT_ID(eventname)));

      const stageEventIds = await getQueryResults(
        GET_EVENT_ID(eventname),
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      // console.log('StageData ->Map: ' + JSON.stringify(stageEventIds));
      const querystring = eventidlist(stageEventIds);
      const query = `${usernotnullquery(eventname)} and event_id in (${querystring})`;
      // console.log('Athena query-> Map: ' + JSON.stringify(query));
      const athenaRawQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      // console.log('Athena athenaRawQueryResults->Map: ' + JSON.stringify(athenaRawQueryResults));

      for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
        const eventId = athenaRawQueryResults[index].event_id;
        const stExtensions = athenaRawQueryResults[index].user;
        // console.log(`stExtensions: ${stExtensions}`);
        const queryStage = `${IPV_CRI_F2F_DATA(eventname)} and event_id = '${eventId}'`;

        // console.log('queryStage : ' + queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        const stageData = athenaQueryResultsStage[0];
        // console.log(`stExtensions: ${stExtensions}`);
        // console.log('RAW Data ->Map: ' + parseData(stExtensions));
       const rawData= parseData(stExtensions);
        validateData(rawData, stageData);
        expect(stExtensions.iss).toEqual(athenaQueryResultsStage[0].extensions_iss);
        // expect(rawData.successful).toEqual(athenaQueryResultsStage[0].extensions_successful);

      }
    },
    240000,
  );

  function validateData(rawData, stageData): void {
    const govuksigninjourney_id = rawData.govuk_signin_journey_id;
    if (
      govuksigninjourney_id !== 'null' &&
      govuksigninjourney_id !== null &&
      govuksigninjourney_id !== undefined
    ) {
      const stageBiometricverificationprocesslevel = stageData.user_govuk_signin_journey_id;
      expect(govuksigninjourney_id).toEqual(stageBiometricverificationprocesslevel);
    }
    const user_id = rawData.user_id;
    if (
      user_id !== 'null' &&
      user_id !== null &&
      user_id !== undefined
    ) {
      const stageUserId = stageData.user_user_id;
      expect(user_id).toEqual(stageUserId);
    }
  }
});
