import { getQueryResults } from '../helpers/db-helpers';
import { AUTH_AUTHORISATION_DATA, GET_EVENT_ID, extensionsnotnullquery } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, extensionToMapauthAuthorisation } from '../helpers/common-helpers';

describe('AUTH_ORCHESTRATION GROUP Test - validate data at stage layer', () => {
  test.concurrent.each`
    eventName                    
    ${'AUTH_AUTHORISATION_REQUEST_RECEIVED'}   
    ${'AUTH_AUTHORISATION_REQUEST_ERROR'}  
    ${'AUTH_AUTHORISATION_INITIATED'}  

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
        const stExtensions = athenaQueryResults[index].extensions;
        const extensionsMap = extensionToMapauthAuthorisation(stExtensions);
        const queryStage = `${AUTH_AUTHORISATION_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log(queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        if (eventname === 'AUTH_AUTHORISATION_INITIATED') {
          // console.log('queryStage' + JSON.stringify(athenaQueryResultsStage));
          if (
            extensionsMap.clientname !== 'null' &&
            extensionsMap.clientname !== null &&
            extensionsMap.clientname !== undefined
          ) {
            const extensionsClientname = athenaQueryResultsStage[0].extensions_clientname.replaceAll('"', '');
            // console.log('Athena Data--> ' + athenaQueryResultsStage[0].extensions_mfatype);
            expect(data.clientname).toEqual(extensionsClientname);
          }
        }

        if (eventname === 'AUTH_IPV_AUTHORISATION_REQUESTED') {
          // console.log('queryStage' + JSON.stringify(athenaQueryResultsStage));
          if (
            extensionsMap.clientlandingpageurl !== 'null' &&
            extensionsMap.clientlandingpageurl !== null &&
            extensionsMap.clientlandingpageurl !== undefined
          ) {
            const extensionsClientlandingpageurl =
              athenaQueryResultsStage[0].extensions_clientlandingpageurl.replaceAll('"', '');
            // console.log('Athena Data--> ' + athenaQueryResultsStage[0].extensions_mfatype);
            expect(data.clientlandingpageurl).toEqual(extensionsClientlandingpageurl);
          }
        }

        if (eventname === 'AUTH_AUTHORISATION_REQUEST_ERROR') {
          // console.log('queryStage' + JSON.stringify(athenaQueryResultsStage));
          if (
            extensionsMap.description !== 'null' &&
            extensionsMap.description !== null &&
            extensionsMap.description !== undefined
          ) {
            const extensionsDescription = athenaQueryResultsStage[0].extensions_description.replaceAll('"', '');
            // console.log('Athena Data--> ' + athenaQueryResultsStage[0].extensions_mfatype);
            expect(data.description).toEqual(extensionsDescription);
          }
        }
      }
    },
    240000,
  );
});
