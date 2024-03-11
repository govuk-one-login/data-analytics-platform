import { faker } from '@faker-js/faker';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import {
  GET_EVENT_ID,
  extensionsnotnullquery,
  IPV_CRI_ADDRESS_DATA,
  IPV_CRI_ADDRESS_DATA_CONFORMED,
} from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, extensionToMapWithParam } from '../helpers/common-helpers';

describe('IPV_ADDRESS_CRI_START Data validation Test', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
      ${'IPV_ADDRESS_CRI_END'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event data stored in raw, stage layer and conformed layer',
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
      // console.log("Query Results ->"+JSON.stringify(athenaQueryResults))

      for (let index = 0; index <= athenaQueryResults.length - 1; index++) {
        const eventId = athenaQueryResults[index].event_id;
        const stExtensions = athenaQueryResults[index].extensions;
        const rawData = extensionToMapWithParam(stExtensions, 'client-name={client_name}');
        // console.log('rawData:' + JSON.stringify(rawData));
        const queryStage = `${IPV_CRI_ADDRESS_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log(queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        // console.log('queryStage results->' + JSON.stringify(athenaQueryResultsStage));
        const stageData = athenaQueryResultsStage[0];
        const queryRedShift = `${IPV_CRI_ADDRESS_DATA_CONFORMED} event_id = '${eventId}'`;
        // console.log('queryRedShift' + queryRedShift);
        const redShiftQueryResults = await redshiftRunQuery(queryRedShift);
        // console.log('redShiftQueryResults' + JSON.stringify(redShiftQueryResults));
        validateDataAtStageAndConformed(rawData, stageData, redShiftQueryResults);
      }
    },
    240000,
  );
  function validateDataAtStageAndConformed(rawData, stageData, redShiftQueryResults): void {
    const userId = rawData.user_id;
    if (userId !== 'null' && userId !== null && userId !== undefined) {
      const stageUserId = stageData.user_user_id;
      expect(userId).toEqual(stageUserId);
      expect(stageUserId).toEqual(redShiftQueryResults.Records[0][4].stringValue);
    }
  }
});
