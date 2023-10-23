import { faker } from '@faker-js/faker';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import {
  IPV_JOURNEY_DATA,
  GET_EVENT_ID,
  extensionsnotnullquery,
  IPV_IDENTITY_ISSUED_CONFORMED,
} from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, extensionToMapipvIdentityIssue } from '../helpers/common-helpers';

describe('IPV_IDENTITY_ISSUED GROUP Test - validate data at stage layer', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'IPV_IDENTITY_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
        const data = extensionToMapipvIdentityIssue(stExtensions);
        const queryStage = `${IPV_JOURNEY_DATA(eventname)} and event_id = '${eventId}'`;
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        // console.log("DATA: "+JSON.stringify(athenaQueryResultsStage));
        // console.log("DATA->Map: "+JSON.stringify(data));
        if (data.has_mitigations !== 'null' && data.has_mitigations !== null && data.has_mitigations !== undefined) {
          const hasmitigations = athenaQueryResultsStage[0].extensions_hasmitigations.replaceAll('"', '');
          // console.log('Athena Data--> ' + athenaQueryResultsStage[0].extensions_hasmitigations);
          expect(data.has_mitigations).toEqual(hasmitigations);
        }
        if (
          data.level_of_confidence !== 'null' &&
          data.level_of_confidence !== null &&
          data.level_of_confidence !== undefined
        ) {
          const levelofconfidence = athenaQueryResultsStage[0].extensions_levelofconfidence.replaceAll('"', '');
          expect(data.level_of_confidence).toEqual(levelofconfidence);
        }
        if (data.ci_fail !== 'null' && data.ci_fail !== null && data.ci_fail !== undefined) {
          const cifail = athenaQueryResultsStage[0].extensions_cifail.replaceAll('"', '');
          // console.log(athenaQueryResultsStage[0].extensions_cifail);
          // console.log('Map--> ' + data['notification-type']);
          expect(data.ci_fail).toEqual(cifail);
        }

        const queryRedShift = `${IPV_IDENTITY_ISSUED_CONFORMED} event_id = '${eventId}'`;
        // console.log('redShiftQuery:'+queryRedShift);
        const redShiftQueryResults = await redshiftRunQuery(queryRedShift);
        // console.log('queryRedShift'+JSON.stringify(redShiftQueryResults));
        for (let index = 0; index <= redShiftQueryResults.Records.length - 1; index++) {
          if (redShiftQueryResults.Records != null) {
            if (
              data.has_mitigations !== 'null' &&
              data.has_mitigations !== null &&
              data.has_mitigations !== undefined
            ) {
              const hasMitigations = redShiftQueryResults.Records[index][2].booleanValue;
              // const expectHasMitigations = data.has_mitigations.replaceAll('"', '');
              expect(data.has_mitigations.toString()).toEqual(hasMitigations.toString());
            }
            if (
              data.level_of_confidence !== 'null' &&
              data.level_of_confidence !== null &&
              data.level_of_confidence !== undefined
            ) {
              const levelOfConfidence = redShiftQueryResults.Records[index][3].stringValue;
              expect(data.level_of_confidence).toEqual(levelOfConfidence);
            }
            if (data.ci_fail !== 'null' && data.ci_fail !== null && data.ci_fail !== undefined) {
              const cifail = redShiftQueryResults.Records[index][4].booleanValue;
              // console.log(athenaQueryResultsStage[0].extensions_cifail);
              // console.log('Map--> ' + data['notification-type']);
              expect(data.ci_fail.toString()).toEqual(cifail.toString());
            }
          }
        }
      }
    },
    240000,
  );
});
