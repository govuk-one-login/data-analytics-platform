import { getQueryResults } from '../helpers/db-helpers';
import { GET_EVENT_ID, extensionsnotnullquery, IPV_CRI_F2F_DATA, restrictednotnullquery } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, extensionToMap1F2fCriVcIssued } from '../helpers/common-helpers';

describe('IPV_CRI_F2F GROUP Test - validate data at stage layer', () => {
  test.concurrent.each`
  eventName                           
  ${'F2F_YOTI_RESPONSE_RECEIVED'} 
  ${'IPR_USER_REDIRECTED'}
  ${'IPR_RESULT_NOTIFICATION_EMAILED'}
  ${'F2F_CRI_VC_ISSUED'} 
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
      let stExtensions = null
      const querystring = eventidlist(eventidresults);
      if (eventname ===   'F2F_CRI_VC_ISSUED')
      {
        const query = `${restrictednotnullquery(eventname)} and event_id in (${querystring})`;
      }
      else
      {
        const query = `${extensionsnotnullquery(eventname)} and event_id in (${querystring})`;
      }
        const athenaQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      for (let index = 0; index <= athenaQueryResults.length - 1; index++) {
        const eventId = athenaQueryResults[index].event_id;
        if (eventname ===   'F2F_CRI_VC_ISSUED')
        {
          stExtensions = athenaQueryResults[index].restricted;
          const data = extensionToMap1F2fCriVcIssued(stExtensions);
        }
        else
        {
          stExtensions = athenaQueryResults[index].extensions.replace('{', '').replace('}', '').split('=')[1];
        }
        
        const queryStage = `${IPV_CRI_F2F_DATA(eventname)} and event_id = '${eventId}'`;
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        if (eventname ===   'F2F_CRI_VC_ISSUED')
        {
          if (data.restricted_residencepermit !== 'null' && data.restricted_residencepermit !== null && data.restricted_residencepermit !== undefined) {
            const restricted_residencepermit =
              athenaQueryResultsStage[0].restricted_residencepermit.replaceAll('"', '');
            expect(data.restricted_residencepermit).toEqual(restricted_residencepermit);
          }
          if (data.restricted_drivingpermit !== 'null' && data.restricted_drivingpermit !== null && data.restricted_drivingpermit !== undefined) {
            const restricted_drivingpermit =
              athenaQueryResultsStage[0].restricted_drivingpermit.replaceAll('"', '');
            expect(data.restricted_drivingpermit).toEqual(restricted_drivingpermit);
          }
          if (data.restricted_idcard !== 'null' && data.restricted_idcard !== null && data.restricted_idcard !== undefined) {
            const restricted_idcard =
              athenaQueryResultsStage[0].restricted_idcard.replaceAll('"', '');
            expect(data.restricted_idcard).toEqual(restricted_idcard);
          }
          if (data.restricted_passport !== 'null' && data.restricted_passport !== null && data.restricted_passport !== undefined) {
            const restricted_passport =
              athenaQueryResultsStage[0].restricted_passport.replaceAll('"', '');
            expect(data.restricted_passport).toEqual(restricted_passport);
          }
        }
        else
        {
          if (stExtensions !== 'null' && stExtensions !== null && stExtensions !== undefined) {
            const previousgovuksigninjourneyid =
              athenaQueryResultsStage[0].extensions_previousgovuksigninjourneyid.replaceAll('"', '');
            expect(stExtensions).toEqual(previousgovuksigninjourneyid);
          }
        }
          

      }
    },
    240000,
  );
});
