import { getQueryResults } from '../helpers/db-helpers';
import {
  GET_EVENT_IDS,
  raw_txma_with_extensions,
  stage_txma_stage_layer_with_extensions,
} from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist } from '../helpers/common-helpers';
import { basicChecksMethod } from '../helpers/event-data-helper';

describe('Complex event Test - validate data at stage layer', () => {
  test.concurrent.each`
    eventName                    
    ${'IPV_KBV_CRI_VC_ISSUED'}
    `(
    'Should validate $eventName event  stored in raw and stage layer',
    async ({ ...data }) => {
      // given
      const eventname = data.eventName;
      const eventidresults = await getQueryResults(
        GET_EVENT_IDS(eventname),
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      if (eventidresults.length > 0) {
        const querystring = eventidlist(eventidresults);
        const query = `${raw_txma_with_extensions} where event_id in (${querystring})`;
        const athenaRawQueryResults = await getQueryResults(
          query,
          txmaRawDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        basicChecksMethod(athenaRawQueryResults);
        for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
          const eventId = athenaRawQueryResults[index].event_id;
          const queryStage = `${stage_txma_stage_layer_with_extensions} and  event_id = '${eventId}'`;
          const athenaQueryStageResults: unknown = await getQueryResults(
            queryStage,
            txmaStageDatabaseName(),
            txmaProcessingWorkGroupName(),
          );

          const cleanedString = JSON.stringify(athenaRawQueryResults[index].extensions);
          const parsedData = JSON.parse(cleanedString.replace(/=/g, ':').replace(/null/g, 'null'));
        }
      }
    },
    240000,
  );
});