import { faker } from '@faker-js/faker';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import { GET_EVENT_ID, extensionsnotnullquery, IPV_CRI_FRAUD_DATA } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, parseData } from '../helpers/common-helpers';

describe('IPV_FRAUD_CRI_VC_ISSUED data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'IPV_FRAUD_CRI_VC_ISSUED'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
      const querystring = eventidlist(stageEventIds);
      const query = `${extensionsnotnullquery(eventname)} and event_id in (${querystring})`;
      // console.log('Athena query-> Map: ' + JSON.stringify(query));
      const athenaRawQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      // console.log('Athena athenaRawQueryResults->Map: ' + JSON.stringify(athenaRawQueryResults));

      for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
        const eventId = athenaRawQueryResults[index].event_id;
        const stExtensions = athenaRawQueryResults[index].extensions;
        // const rawData = parseData(stExtensions);
        // console.log('rawRestrictedData : ' + JSON.stringify(stExtensions));
        const rawData = parseData(stExtensions);
        // console.log('Athena athenaRawQueryResults->Map: ' + JSON.stringify(rawData));
        const queryStage = `${IPV_CRI_FRAUD_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log('queryStage : ' + queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        // console.log('athenaQueryResultsStage : ' + JSON.stringify(athenaQueryResultsStage));
        const stageData = JSON.parse(athenaQueryResultsStage[0].extensions_evidence);
        // const queryRedShift = `${IPV_CRI_F2F_CONFORMED} event_id = '${eventId}'`;
        // console.log('queryRedShift-->' + queryRedShift);
        // console.log('stageData-->' + JSON.stringify(stageData));
        // const redShiftQueryResults = await redshiftRunQuery(queryRedShift);
        // console.log('redShiftQueryResults' + JSON.stringify(redShiftQueryResults));
        validateEvidenceData(rawData, stageData);
      }
    },
    240000,
  );

  function validateEvidenceData(rawData, stageData): void {
    const rawActivityhiStoryScore = rawData.evidence.decisionscore.activityhistoryscore;

    if (
      rawActivityhiStoryScore !== 'null' &&
      rawActivityhiStoryScore !== null &&
      rawActivityhiStoryScore !== undefined
    ) {
      const parseData1 = parseData(stageData.decisionscore);
      expect(rawActivityhiStoryScore).toEqual(parseData1.activityhistoryscore);
    }
  }
});
