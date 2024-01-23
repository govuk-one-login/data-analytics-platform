import { faker } from '@faker-js/faker';
import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';
import {
  IPV_JOURNEY_DATA,
  GET_EVENT_ID,
  extensionsnotnullquery,
  IPV_IDENTITY_ISSUED_CONFORMED,
  getDataUserIdNotNull,
} from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist, extensionToMapipvIdentityIssue, parseData } from '../helpers/common-helpers';

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

describe('IPV_JOURNEY Batch 2 data validation Test - validate data at stage and raw layer', () => {
  test.each`
    eventName
    ${'IPV_CORE_CRI_RESOURCE_RETRIEVED'}
    ${'IPV_CRI_AUTH_RESPONSE_RECEIVED'}
    ${'IPV_DELETE_USER_DATA'}
    ${'IPV_GPG45_PROFILE_MATCHED'}
    ${'IPV_REDIRECT_TO_CRI'}
    ${'IPV_SPOT_REQUEST_RECEIVED'}
    ${'IPV_SPOT_REQUEST_VALIDATION_FAILURE'}
    ${'IPV_VC_RECEIVED'}
  `(
    'Should validate $eventName event data stored in raw and stage layer',
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
      const query = `${getDataUserIdNotNull(eventname)} and event_id in (${querystring})`;
      // console.log('Athena query-> Map: ' + JSON.stringify(query));
      const athenaRawQueryResults = await getQueryResults(query, txmaRawDatabaseName(), txmaProcessingWorkGroupName());
      // console.log('Athena athenaRawQueryResults->Map: ' + JSON.stringify(athenaRawQueryResults));

      for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
        const eventId = athenaRawQueryResults[index].event_id;
        const queryStage = `${IPV_JOURNEY_DATA(eventname)} and event_id = '${eventId}'`;
        // console.log('queryStage : ' + queryStage);
        const athenaQueryResultsStage = await getQueryResults(
          queryStage,
          txmaStageDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        const stageData = athenaQueryResultsStage[0];

        // console.log('stageDataParse ->Map: ' + JSON.stringify(stageData));
        validateData(athenaRawQueryResults[index], stageData);
        // expect(stExtensions.iss).toEqual(athenaQueryResultsStage[0].extensions_iss);
        // expect(rawData.successful).toEqual(athenaQueryResultsStage[0].extensions_successful);
      }
    },
    240000,
  );

  function validateData(rawDataQueryData, stageData): void {
    const rawData = parseData(rawDataQueryData.user);
    // console.log('rawData ->Map: ' + JSON.stringify(rawData));

    const govukSigninJourneyId = rawData.govuk_signin_journey_id;
    if (govukSigninJourneyId !== 'null' && govukSigninJourneyId !== null && govukSigninJourneyId !== undefined) {
      const stageBiometricverificationprocesslevel = stageData.user_govuk_signin_journey_id;
      expect(govukSigninJourneyId).toEqual(stageBiometricverificationprocesslevel);
      // console.log('stageBiometricverificationprocesslevel ->Map: ' + JSON.stringify(govukSigninJourneyId));
    }
    const userId = rawData.user_id;
    if (userId !== 'null' && userId !== null && userId !== undefined) {
      const stageUserId = stageData.user_user_id;
      expect(userId).toEqual(stageUserId);
      // console.log('stageUserId ->Map: ' + JSON.stringify(stageUserId));
    }
    const rawClientId = rawDataQueryData.client_id;
    if (rawClientId !== 'null' && rawClientId !== null && rawClientId !== undefined) {
      const stageClientId = stageData.client_id;
      // console.log('rawClientId ->Map: ' + JSON.stringify(rawClientId));
      // console.log('stageClientId ->Map: ' + JSON.stringify(stageClientId));
      expect(rawClientId).toEqual(stageClientId);
    }
    const rawComponentId = rawDataQueryData.component_id;
    if (rawComponentId !== 'null' && rawComponentId !== null && rawComponentId !== undefined) {
      const stageComponentId = stageData.component_id;
      // console.log('rawComponentId ->Map: ' + JSON.stringify(rawComponentId));
      // console.log('stageComponentId ->Map: ' + JSON.stringify(stageComponentId));
      expect(rawComponentId).toEqual(stageComponentId);
    }
  }
});
