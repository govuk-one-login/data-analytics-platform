import { getQueryResults } from '../helpers/db-helpers';
import {
  GET_EVENT_ID,
  extensionsnotnullquery,
  IPV_CRI_F2F_DATA,
  restrictednotnullquery,
} from '../helpers/query-constant';
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
      let stExtensions = null;
      let query = null;
      const querystring = eventidlist(eventidresults);
      if (eventname === 'F2F_CRI_VC_ISSUED') {
        query = `${restrictednotnullquery(eventname)} and event_id in (${querystring})`;
      } else {
        query = `${extensionsnotnullquery(eventname)} and event_id in (${querystring})`;
      }
      const athenaQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      for (let index = 0; index <= athenaQueryResults.length - 1; index++) {
        const eventId = athenaQueryResults[index].event_id;
        let extensionsData = null;
        if (eventname === 'F2F_CRI_VC_ISSUED') {
          stExtensions = athenaQueryResults[index].restricted;
        } else {
          stExtensions = athenaQueryResults[index].extensions.replace('{', '').replace('}', '').split('=')[1];
        }

        const queryStage = `${IPV_CRI_F2F_DATA(eventname)} and event_id = '${eventId}'`;
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        extensionsData = extensionToMap1F2fCriVcIssued(stExtensions);
        if (eventname === 'F2F_CRI_VC_ISSUED') {
          if (
            extensionsData.restrictedResidencePermit !== 'null' &&
            extensionsData.restrictedResidencePermit !== null &&
            extensionsData.restrictedResidencePermit !== undefined
          ) {
            const restrictedResidencePermit = athenaQueryResultsStage[0].restrictedResidencePermit.replaceAll('"', '');
            expect(extensionsData.restrictedResidencePermit).toEqual(restrictedResidencePermit);
          }
          if (
            extensionsData.restrictedDrivingPermit !== 'null' &&
            extensionsData.restrictedDrivingPermit !== null &&
            extensionsData.restrictedDrivingPermit !== undefined
          ) {
            const restrictedDrivingPermit = athenaQueryResultsStage[0].restrictedDrivingPermit.replaceAll('"', '');
            expect(extensionsData.restrictedDrivingPermit).toEqual(restrictedDrivingPermit);
          }
          if (
            extensionsData.restrictedIdCard !== 'null' &&
            extensionsData.restrictedIdCard !== null &&
            extensionsData.restrictedIdCard !== undefined
          ) {
            const restrictedIdCard = athenaQueryResultsStage[0].restrictedIdCard.replaceAll('"', '');
            expect(extensionsData.restrictedIdCard).toEqual(restrictedIdCard);
          }
          if (
            extensionsData.restrictedPassport !== 'null' &&
            extensionsData.restrictedPassport !== null &&
            extensionsData.restrictedPassport !== undefined
          ) {
            const restrictedPassport = athenaQueryResultsStage[0].restrictedPassport.replaceAll('"', '');
            expect(extensionsData.restrictedPassport).toEqual(restrictedPassport);
          }
        } else {
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
