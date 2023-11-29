import { getQueryResults } from '../helpers/db-helpers';
import { GET_EVENT_ID, extensionsnotnullquery, IPV_CRI_DRIVING_LICENSE_DATA } from '../helpers/query-constant';
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
