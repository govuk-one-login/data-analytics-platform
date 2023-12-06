import { faker } from '@faker-js/faker';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import {
  GET_EVENT_ID,
  IPV_CRI_F2F_DATA,
  IPV_CRI_F2F_CONFORMED,
  restrictednotnullquery,
} from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, parseConformedDocType, parseData } from '../helpers/common-helpers';

describe('F2F_YOTI_START data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName           | event_id               | client_id              | journey_id
    ${'F2F_YOTI_START'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
      const query = `${restrictednotnullquery(eventname)} and event_id in (${querystring})`;
      // console.log('Athena query-> Map: ' + JSON.stringify(query));
      const athenaRawQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      // console.log('Athena athenaRawQueryResults->Map: ' + JSON.stringify(athenaRawQueryResults));

      for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
        const eventId = athenaRawQueryResults[index].event_id;
        const rawRestrictions = athenaRawQueryResults[index].restricted;
        const rawRestrictedData = parseData(rawRestrictions);
        // console.log('rawRestrictedData : ' + JSON.stringify(rawRestrictedData));
        const queryStage = `${IPV_CRI_F2F_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log('queryStage : ' + queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        const queryRedShift = `${IPV_CRI_F2F_CONFORMED} event_id = '${eventId}'`;
        // console.log('queryRedShift-->' + queryRedShift);
        const redShiftQueryResults = await redshiftRunQuery(queryRedShift);
        // console.log('redShiftQueryResults' + JSON.stringify(redShiftQueryResults));
        validateRestrictionsData(rawRestrictedData, athenaQueryResultsStage, redShiftQueryResults);
      }
    },
    240000,
  );
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
      // console.log("owcohow---->", conformedDocTypeObj.documenttype);
      // console.log("owcohow---->", conformedDocTypeObj.issuingcountry);
      // console.log('conformedDocType->' + JSON.stringify(conformedDocType));
      expect(stageDocType).toEqual(conformedDocTypeObj.documenttype);
      const issuingCountry = stageData[0].issuingcountry;
      if (issuingCountry !== 'null' && issuingCountry !== null && issuingCountry !== undefined) {
        // console.log('issuingCountry->' + JSON.stringify(issuingCountry));
        expect(issuingCountry).toEqual(conformedDocTypeObj.issuingcountry);
      }
    }
    const residencePermit = rawRestrictedData.residencepermit[0].documenttype;
    if (residencePermit !== 'null' && residencePermit !== null && residencePermit !== undefined) {
      const stageData = JSON.parse(athenaQueryResultsStage[0].restricted_residencepermit);
      // console.log('stageDocType->' + JSON.stringify(athenaQueryResultsStage));
      const stageDocType = stageData[0].documenttype;
      expect(residencePermit).toEqual(stageDocType);
      const conformedDocType = redShiftQueryResults.Records[0][6].stringValue;
      const conformedDocTypeObj = parseConformedDocType(conformedDocType);
      // console.log('conformedDocType->' + JSON.stringify(conformedDocType));
      expect(stageDocType).toEqual(conformedDocTypeObj.documenttype);
      const issuingCountry = stageData[0].issuingcountry;
      if (issuingCountry !== 'null' && issuingCountry !== null && issuingCountry !== undefined) {
        // console.log('issuingCountry->' + JSON.stringify(issuingCountry));
        expect(issuingCountry).toEqual(conformedDocTypeObj.issuingcountry);
      }
    }
    const passport = rawRestrictedData.passport[0].documenttype;
    if (passport !== 'null' && passport !== null && passport !== undefined) {
      const stageData = JSON.parse(athenaQueryResultsStage[0].restricted_passport);
      // console.log('stageDocType->' + JSON.stringify(athenaQueryResultsStage));
      const stageDocType = stageData[0].documenttype;
      expect(passport).toEqual(stageDocType);
      const conformedDocType = redShiftQueryResults.Records[0][5].stringValue;
      const conformedDocTypeObj = parseConformedDocType(conformedDocType);
      // console.log('conformedDocType->' + JSON.stringify(conformedDocType));
      expect(stageDocType).toEqual(conformedDocTypeObj.documenttype);
      const issuingCountry = stageData[0].issuingcountry;
      if (issuingCountry !== 'null' && issuingCountry !== null && issuingCountry !== undefined) {
        // console.log('issuingCountry->' + JSON.stringify(issuingCountry));
        expect(issuingCountry).toEqual(conformedDocTypeObj.issuingcountry);
      }
    }
    const idcard = rawRestrictedData.idcard[0].documenttype;
    if (idcard !== 'null' && idcard !== null && idcard !== undefined) {
      const stageData = JSON.parse(athenaQueryResultsStage[0].restricted_idcard);
      // console.log('stageDocType->' + JSON.stringify(athenaQueryResultsStage));
      const stageDocType = stageData[0].documenttype;
      expect(idcard).toEqual(stageDocType);
      const conformedDocType = redShiftQueryResults.Records[0][5].stringValue;
      const conformedDocTypeObj = parseConformedDocType(conformedDocType);
      // console.log('conformedDocType->' + JSON.stringify(conformedDocType));
      expect(stageDocType).toEqual(conformedDocTypeObj.documenttype);

      const issuingCountry = stageData[0].issuingcountry;
      if (issuingCountry !== 'null' && issuingCountry !== null && issuingCountry !== undefined) {
        // console.log('issuingCountry->' + JSON.stringify(issuingCountry));
        expect(issuingCountry).toEqual(conformedDocTypeObj.issuingcountry);
      }
    }
  }
});
