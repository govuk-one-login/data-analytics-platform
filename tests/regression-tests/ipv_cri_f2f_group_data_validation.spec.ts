import { getQueryResults } from '../helpers/db-helpers';
import { GET_EVENT_ID, extensionsnotnullquery, IPV_CRI_F2F_DATA } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist } from '../helpers/common-helpers';

describe('IPV_CRI_F2F GROUP Test - validate data at stage layer', () => {
  test.concurrent.each`
  eventName                           
  ${'F2F_YOTI_RESPONSE_RECEIVED'} 
  ${'IPR_USER_REDIRECTED'}
  ${'IPR_RESULT_NOTIFICATION_EMAILED'}
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
        const stExtensions = athenaQueryResults[index].extensions.replace('{', '').replace('}', '').split('=')[1];
        const queryStage = `${IPV_CRI_F2F_DATA(eventname)} and event_id = '${eventId}'`;
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        if (stExtensions !== 'null' && stExtensions !== null && stExtensions !== undefined) {
          const previousgovuksigninjourneyid =
            athenaQueryResultsStage[0].extensions_previousgovuksigninjourneyid.replaceAll('"', '');
          expect(stExtensions).toEqual(previousgovuksigninjourneyid);
        }
      }
    },
    240000,
  );
});
