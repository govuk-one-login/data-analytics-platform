import { getQueryResults } from '../helpers/db-helpers';
import { DCMAW_CRI_DATA, GET_EVENT_ID, getDataUserIdNotNull } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, parseData } from '../helpers/common-helpers';

describe('DCMAW_CRI data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName
    ${'DCMAW_ABORT_APP'}
    ${'DCMAW_ABORT_WEB'}
    ${'DCMAW_CRI_4XXERROR'}
    ${'DCMAW_CRI_5XXERROR'}
    ${'DCMAW_HYBRID_BILLING_STARTED'}
    ${'DCMAW_IPROOV_BILLING_STARTED'}
    ${'DCMAW_IPROOV_BILLING_STARTED'}
    ${'DCMAW_ABORT_WEB'}
    ${'DCMAW_MISSING_CONTEXT_AFTER_ABORT'}
    ${'DCMAW_MISSING_CONTEXT_AFTER_COMPLETION'}
    ${'DCMAW_READID_NFC_BILLING_STARTED'}
    ${'DCMAW_REDIRECT_ABORT'}
    ${'DCMAW_REDIRECT_SUCCESS'}
  `(
    'Should validate $eventName event data stored in raw and stage layer',
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
      const query = `${getDataUserIdNotNull(eventname)} and event_id in (${querystring})`;
      // console.log('Athena query-> Map: ' + JSON.stringify(query));
      const athenaRawQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      // console.log('Athena athenaRawQueryResults->Map: ' + JSON.stringify(athenaRawQueryResults));

      for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
        const eventId = athenaRawQueryResults[index].event_id;
        const queryStage = `${DCMAW_CRI_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log('queryStage : ' + queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        const stageData = athenaQueryResultsStage[0];

        // console.log('stageDataParse ->Map: ' + JSON.stringify(stageData));
        validateData(athenaRawQueryResults[index], stageData);
        // expect(stExtensions.iss).toEqual(athenaQueryResultsStage[0].extensions_iss);
        // expect(rawData.successful).toEqual(athenaQueryResultsStage[0].extensions_successful);
      }
    },
    240000,
  );

  function validateData(rawDataQueryData, stageData): void {
    const rawData = parseData(rawDataQueryData.user);
    // console.log('rawData ->Map: ' + JSON.stringify(rawData));

    const govukSigninJourneyId = rawData.govuk_signin_journey_id;
    if (govukSigninJourneyId !== 'null' && govukSigninJourneyId !== null && govukSigninJourneyId !== undefined) {
      const stageBiometricverificationprocesslevel = stageData.user_govuk_signin_journey_id;
      expect(govukSigninJourneyId).toEqual(stageBiometricverificationprocesslevel);
      // console.log('stageBiometricverificationprocesslevel ->Map: ' + JSON.stringify(govukSigninJourneyId));
    }
    const userId = rawData.user_id;
    if (userId !== 'null' && userId !== null && userId !== undefined) {
      const stageUserId = stageData.user_user_id;
      expect(userId).toEqual(stageUserId);
      // console.log('stageUserId ->Map: ' + JSON.stringify(stageUserId));
    }
    const rawClientId = rawDataQueryData.client_id;
    if (rawClientId !== 'null' && rawClientId !== null && rawClientId !== undefined) {
      const stageClientId = stageData.client_id;
      // console.log('rawClientId ->Map: ' + JSON.stringify(rawClientId));
      // console.log('stageClientId ->Map: ' + JSON.stringify(stageClientId));
      expect(rawClientId).toEqual(stageClientId);
    }
    const rawComponentId = rawDataQueryData.component_id;
    if (rawComponentId !== 'null' && rawComponentId !== null && rawComponentId !== undefined) {
      const stageComponentId = stageData.component_id;
      // console.log('rawComponentId ->Map: ' + JSON.stringify(rawComponentId));
      // console.log('stageComponentId ->Map: ' + JSON.stringify(stageComponentId));
      expect(rawComponentId).toEqual(stageComponentId);
    }
  }
});
