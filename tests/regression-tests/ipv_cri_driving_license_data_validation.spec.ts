import { getQueryResults } from '../helpers/db-helpers';
import {
  GET_EVENT_ID,
  extensionsnotnullquery,
  IPV_CRI_DRIVING_LICENSE_DATA,
  getDataUserIdNotNull,
} from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, parseData } from '../helpers/common-helpers';

describe('IPV_CRI_DRIVING_LICENSE data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName
    ${'IPV_DL_CRI_VC_ISSUED'}
  `(
    'Should validate $eventName event extensions  stored in raw and stage layer',
    async ({ ...data }) => {
      // given
      const eventname = data.eventName;

      const stageEventIds = await getQueryResults(
        GET_EVENT_ID(eventname),
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );

      const querystring = eventidlist(stageEventIds);
      const query = `${extensionsnotnullquery(eventname)} and event_id in (${querystring})`;

      const athenaRawQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());

      for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
        const eventId = athenaRawQueryResults[index].event_id;
        const stExtensions = athenaRawQueryResults[index].extensions;
        const rawData = parseData(stExtensions);

        const queryStage = `${IPV_CRI_DRIVING_LICENSE_DATA(eventname)} and event_id = '${eventId}'`;
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );

        const stageData = JSON.parse(athenaQueryResultsStage[0].extensions_evidence);
        validateEvidenceData(rawData, stageData);
        expect(rawData.iss).toEqual(athenaQueryResultsStage[0].extensions_iss);
      }
    },
    240000,
  );

  function validateEvidenceData(rawData, stageData): void {
    const rawDecisionscore = rawData.evidence.decisionscore;

    if (rawDecisionscore !== 'null' && rawDecisionscore !== null && rawDecisionscore !== undefined) {
      const stageDecisionscore = stageData.decisionscore;
      expect(rawDecisionscore).toEqual(stageDecisionscore);
    }
    const rawCheckmethod = rawData.evidence.checkdetails.checkmethod;
    if (rawCheckmethod !== 'null' && rawCheckmethod !== null && rawCheckmethod !== undefined) {
      const stageCheckmethod = stageData.checkdetails.checkmethod;
      expect(rawCheckmethod).toEqual(stageCheckmethod);
    }

    const rawIdentityfraudscore = rawData.evidence.checkdetails.identityfraudscore;
    if (rawIdentityfraudscore !== 'null' && rawIdentityfraudscore !== null && rawIdentityfraudscore !== undefined) {
      const stageIdentityfraudscore = stageData.checkdetails[0].identityfraudscore;
      expect(rawIdentityfraudscore).toEqual(stageIdentityfraudscore);
    }
  }
});

describe('IPV_CRI_DRIVING_LICENSE Batch 2 data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName
    ${'IPV_DL_CRI_END'}
    ${'IPV_DL_CRI_REQUEST_SENT'}
    ${'IPV_DL_CRI_RESPONSE_RECEIVED'}
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
        const queryStage = `${IPV_CRI_DRIVING_LICENSE_DATA(eventname)} and event_id = '${eventId}'`;
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
