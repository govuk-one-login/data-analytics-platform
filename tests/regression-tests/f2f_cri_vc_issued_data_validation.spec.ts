import { faker } from '@faker-js/faker';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import {
  GET_EVENT_ID,
  IPV_CRI_F2F_DATA,
  IPV_CRI_F2F_CONFORMED,
  extensionsandrestrictionnotnullquery,
} from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import {
  eventidlist,
  parseConformedDocType,
  parseData,
} from '../helpers/common-helpers';

describe('F2F_CRI_VC_ISSUED data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName              | event_id               | client_id              | journey_id
    ${'F2F_CRI_VC_ISSUED'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
      const query = `${extensionsandrestrictionnotnullquery(eventname)} and event_id in (${querystring})`;
      // console.log('Athena query-> Map: ' + JSON.stringify(query));
      const athenaRawQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      // console.log('Athena athenaRawQueryResults->Map: ' + JSON.stringify(athenaRawQueryResults));

      for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
        const eventId = athenaRawQueryResults[index].event_id;
        const stExtensions = athenaRawQueryResults[index].extensions;
        const rawRestrictions = athenaRawQueryResults[index].restricted;
        const rawData = parseData(stExtensions);
        const rawRestrictedData = parseData(rawRestrictions);
        // console.log('rawRestrictedData : ' + JSON.stringify(rawRestrictedData));

        const queryStage = `${IPV_CRI_F2F_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log('queryStage : ' + queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        const stageData = JSON.parse(athenaQueryResultsStage[0].extensions_evidence);
        validateEvidenceData(rawData, stageData);
        expect(rawData.iss).toEqual(athenaQueryResultsStage[0].extensions_iss);
        expect(rawData.successful).toEqual(athenaQueryResultsStage[0].extensions_successful);

        const queryRedShift = `${IPV_CRI_F2F_CONFORMED} event_id = '${eventId}'`;
        // console.log('queryRedShift' + queryRedShift);
        const redShiftQueryResults = await redshiftRunQuery(queryRedShift);
        // console.log('redShiftQueryResults' + JSON.stringify(redShiftQueryResults));
        // validateEvidenceData(rawData, athenaQueryResultsStage);
        validateRestrictionsData(rawRestrictedData, athenaQueryResultsStage, redShiftQueryResults);
      }
    },
    240000,
  );

  function validateEvidenceData(rawData, stageData): void {
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
      expect(photoverificationprocesslevel).toEqual(stagePhotoverificationprocesslevel.toString());
    }
  }
  function validateRestrictionsData(rawRestrictedData, athenaQueryResultsStage, redShiftQueryResults): void {
    // const stageData = JSON.parse(athenaQueryResultsStage[0].restricted_drivingpermit);
    const drivingpermit = rawRestrictedData.drivingpermit[0].documenttype;
    if (drivingpermit !== 'null' && drivingpermit !== null && drivingpermit !== undefined) {
      const stageData = JSON.parse(athenaQueryResultsStage[0].restricted_drivingpermit);
      // console.log('stageDocType->' + JSON.stringify(athenaQueryResultsStage));
      const stageDocType = stageData[0].documenttype;
      expect(drivingpermit).toEqual(stageDocType);
      const conformedDocType = redShiftQueryResults.Records[0][3].stringValue;
      const conformedDocTypeObj = parseConformedDocType(conformedDocType);
      // console.log('conformedDocType->' + JSON.stringify(conformedDocTypeObj));
      // console.log('conformedDocType->' + JSON.stringify(redShiftQueryResults));
      expect(stageDocType).toEqual(conformedDocTypeObj.documenttype);
    }
    const residencePermit = rawRestrictedData.residencepermit[0].documenttype;
    if (residencePermit !== 'null' && residencePermit !== null && residencePermit !== undefined) {
      const stageData = JSON.parse(athenaQueryResultsStage[0].restricted_residencepermit);
      // console.log('stageDocType->' + JSON.stringify(athenaQueryResultsStage));
      const stageDocType = stageData[0].documenttype;
      expect(residencePermit).toEqual(stageDocType);
      const conformedDocType = redShiftQueryResults.Records[0][6].stringValue;
      const conformedDocTypeObj = parseConformedDocType(conformedDocType);
      // console.log('conformedDocType->' + JSON.stringify(conformedDocTypeObj));
      // console.log('conformedDocType->' + JSON.stringify(redShiftQueryResults));
      expect(stageDocType).toEqual(conformedDocTypeObj.documenttype);
    }
    const passport = rawRestrictedData.passport[0].documenttype;
    if (passport !== 'null' && passport !== null && passport !== undefined) {
      const stageData = JSON.parse(athenaQueryResultsStage[0].restricted_passport);
      // console.log('stageDocType->' + JSON.stringify(athenaQueryResultsStage));
      const stageDocType = stageData[0].documenttype;
      expect(passport).toEqual(stageDocType);
      const conformedDocType = redShiftQueryResults.Records[0][5].stringValue;
      const conformedDocTypeObj = parseConformedDocType(conformedDocType);
      // console.log('conformedDocType->' + JSON.stringify(conformedDocType.documenttype));
      expect(stageDocType).toEqual(conformedDocTypeObj.documenttype);
    }
    const idcard = rawRestrictedData.idcard[0].documenttype;
    if (idcard !== 'null' && idcard !== null && idcard !== undefined) {
      const stageData = JSON.parse(athenaQueryResultsStage[0].restricted_idcard);
      // console.log('stageDocType->' + JSON.stringify(athenaQueryResultsStage));
      const stageDocType = stageData[0].documenttype;
      expect(idcard).toEqual(stageDocType);
      const conformedDocType = redShiftQueryResults.Records[0][5].stringValue;
      // console.log('conformedDocType->' + JSON.stringify(conformedDocType));
      const conformedDocTypeObj = parseConformedDocType(conformedDocType);
      expect(stageDocType).toEqual(conformedDocTypeObj.documenttype);
    }
  }
});
