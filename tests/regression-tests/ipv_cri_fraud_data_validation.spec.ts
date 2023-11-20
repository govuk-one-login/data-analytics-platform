import { getQueryResults } from '../helpers/db-helpers';
import { GET_EVENT_ID, extensionsnotnullquery, IPV_CRI_FRAUD_DATA } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, parseData } from '../helpers/common-helpers';

describe('IPV_CRI_PASSPORT data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName
    ${'IPV_FRAUD_CRI_VC_ISSUED'}
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
      const query = `${extensionsnotnullquery(eventname)} and event_id in (${querystring})`;

      // console.log('Athena query-> Map: ' + JSON.stringify(query));
      const athenaRawQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      // console.log('Athena athenaRawQueryResults->Map: ' + JSON.stringify(athenaRawQueryResults));

      for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
        const eventId = athenaRawQueryResults[index].event_id;
        const stExtensions = athenaRawQueryResults[index].extensions;
        // console.log(`stExtensions: ${stExtensions}`);
        const rawData = parseData(stExtensions);
        // console.log(rawData);

        const queryStage = `${IPV_CRI_FRAUD_DATA(eventname)} and event_id = '${eventId}'`;

        // console.log('queryStage : ' + queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );

        // console.log('queryStage results : ' + athenaQueryResultsStage[0].extensions_evidence);
        const stageData = JSON.parse(athenaQueryResultsStage[0].extensions_evidence);
        // console.log(' iss: ' +JSON.stringify(athenaQueryResultsStage[0]));
        // console.log(' STAGE DATA: ' + JSON.stringify(stageData));
        // console.log('RAW Data ->Map: ' + JSON.stringify(rawData));
        validateEvidenceData(rawData, stageData);
        expect(rawData.iss).toEqual(athenaQueryResultsStage[0].extensions_iss);
        // expect(rawData.successful).toEqual(athenaQueryResultsStage[0].extensions_successful);
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
