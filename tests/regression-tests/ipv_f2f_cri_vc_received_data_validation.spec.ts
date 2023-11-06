import { faker } from '@faker-js/faker';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import {
  IPV_JOURNEY_DATA,
  GET_EVENT_ID,
  extensionsnotnullquery,
  IPV_IDENTITY_ISSUED_CONFORMED,
  IPV_CRI_F2F_DATA,
} from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, extensionToMap, extensionToMapipvIdentityIssue, parseData } from '../helpers/common-helpers';
import { parse } from 'uuid';

describe('IPV_F2F_CRI_VC_RECEIVED data validation Test - validate data at stage and raw layer', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'IPV_F2F_CRI_VC_RECEIVED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
        let rawData = parseData(stExtensions);

        const queryStage = `${IPV_CRI_F2F_DATA(eventname)} and event_id = '${eventId}'`;

        // console.log('queryStage : ' + queryStage);
        let athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        let stageData = JSON.parse(athenaQueryResultsStage[0].extensions_evidence);
        // console.log(' iss: ' +JSON.stringify(athenaQueryResultsStage[0]));
        // console.log(' STAGE DATA: ' + JSON.stringify(stageData));
        // console.log('RAW Data ->Map: ' + JSON.stringify(rawData));
        validateEvidenceData(rawData, stageData);
        expect(rawData.iss).toEqual(athenaQueryResultsStage[0].extensions_iss);
        expect(rawData.successful).toEqual(athenaQueryResultsStage[0].extensions_successful);
      }
    },
    240000,
  );

  function validateEvidenceData(rawData, stageData) {
    const biometricverificationprocesslevel = rawData.evidence[0].biometricverificationprocesslevel;

    if (
      biometricverificationprocesslevel !== 'null' &&
      biometricverificationprocesslevel !== null &&
      biometricverificationprocesslevel !== undefined
    ) {
      const stageBiometricverificationprocesslevel = stageData[0].checkdetails[0].biometricverificationprocesslevel;
      expect(biometricverificationprocesslevel).toEqual(stageBiometricverificationprocesslevel);
    }
    const checkmethod = rawData.evidence[0].checkdetails[0].checkmethod;
    if (checkmethod !== 'null' && checkmethod !== null && checkmethod !== undefined) {
      const stageCheckmethod = stageData[0].checkdetails[0].checkmethod;
      expect(stageCheckmethod).toEqual(stageCheckmethod);
    }

    const photoverificationprocesslevel = rawData.evidence[0].checkdetails[0].photoverificationprocesslevel;
    if (
      photoverificationprocesslevel !== 'null' &&
      photoverificationprocesslevel !== null &&
      photoverificationprocesslevel !== undefined
    ) {
      const stagePhotoverificationprocesslevel = stageData[0].checkdetails[0].photoverificationprocesslevel;
      expect(photoverificationprocesslevel).toEqual(stagePhotoverificationprocesslevel);
    }
  }
});
