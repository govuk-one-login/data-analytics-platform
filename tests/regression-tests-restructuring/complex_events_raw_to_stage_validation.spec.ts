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
          console.log(queryStage);
          const athenaQueryStageResults: unknown = await getQueryResults(
            queryStage,
            txmaStageDatabaseName(),
            txmaProcessingWorkGroupName(),
          );

          // const cleanedString = athenaRawQueryResults[index].extensions;
          const cleanedString = JSON.stringify(athenaRawQueryResults[index].extensions);
          // console.log(cleanedString)
          // const keyValuePairs = cleanedString.split(',');
          // // Initialize a variable to store the value of user_govuk_signin_journey_id
          // let evidence: string | undefined;
          // keyValuePairs.forEach(pair => {
          //   // Split each pair into key and value
          //   const [key, value] = pair.split('=');
          //   // Check if the key is 'user_govuk_signin_journey_id'
          //   if (key.trim() === 'evidence') {
          //     // Store the value
          //     evidence = value.trim() !== 'null' ? value.trim() : undefined;
          //     console.log('evidence    '+evidence)
          //   }
          //   })
          console.log('cleaned data :' + cleanedString);
          // Input string
          // Parse the string into a JavaScript object
          const parsedData = JSON.parse(cleanedString.replace(/=/g, ':').replace(/null/g, 'null'));

          console.log(parsedData);
          // // Extract decisionscore
          // const data: Data = JSON.parse(JSON.stringify(`${parsedData}`));

          // console.log('parsedData data :' + parsedData);
          // console.log('cleaned data :' + data);

          // // Extract decisionscore
          // const decisionscore: string = data.evidence.decisionscore;
          // console.log('decisionscore:', decisionscore);

          // Split the string into key-value pairs

          // expect(athenaRawQueryResults[index].client_id).toEqual(athenaQueryStageResults[0].client_id);
          // expect(athenaRawQueryResults[index].component_id).toEqual(athenaQueryStageResults[0].component_id);
          // const cleanedString = athenaRawQueryResults[index].user.replace(/[{}]/g, '');

          // // Split the string into key-value pairs
          // const keyValuePairs = cleanedString.split(',');
          // // Initialize a variable to store the value of user_govuk_signin_journey_id
          // let userGovukSigninJourneyId: string | undefined;
          // let userId: string | undefined;

          // // Iterate over each key-value pair
          // keyValuePairs.forEach(pair => {
          //   // Split each pair into key and value
          //   const [key, value] = pair.split('=');
          //   // Check if the key is 'user_govuk_signin_journey_id'
          //   if (key.trim() === 'govuk_signin_journey_id') {
          //     // Store the value
          //     userGovukSigninJourneyId = value.trim() !== 'null' ? value.trim() : undefined;
          //   }

          //   if (key.trim() === 'user_id') {
          //     // Store the value
          //     userId = value.trim() !== 'null' ? value.trim() : undefined;
          //   }
          // });
          // expect(userGovukSigninJourneyId).toEqual(athenaQueryStageResults[0].user_govuk_signin_journey_id);
          // expect(userId).toEqual(athenaQueryStageResults[0].user_user_id);
        }
      }
    },
    240000,
  );
});

interface Evidence {
  decisionscore: string;
}

interface Data {
  'client-name': null | string;
  clientlandingpageurl: null | string;
  description: null | string;
  evidence: Evidence;
  isnewaccount: null | string;
  'notification-type': null | string;
  'mfa-type': null | string;
  'account-recovery': null | string;
  previous_govuk_signin_journey_id: null | string;
  iss: null | string;
  successful: null | string;
  addressesentered: null | string;
  gpg45scores: null | string;
  levelofconfidence: null | string;
  cifail: null | string;
  hasmitigations: null | string;
  reason: null | string;
  rejectionreason: null | string;
  reprove_identity: null | string;
  experianiiqresponse: {
    outcome: string;
    totalquestionsansweredcorrect: string;
    totalquestionsansweredincorrect: string;
    totalquestionsasked: string;
  };
  mitigation_type: null | string;
  isukissued: null | string;
  age: null | string;
}

// Define the input string

const jsonString = `{ "client-name": null, "clientlandingpageurl": null, "description": null, "evidence": { "decisionscore": "PCI", "identityfraudscore": "Orchestrator", "type": "finally", "checkdetails": { "checkmethod": "method" }, "failedcheckdetails": { "checkmethod": "Personal" } }, "isnewaccount": null, "notification-type": null, "mfa-type": null, "account-recovery": null, "previous_govuk_signin_journey_id": null, "iss": "Androgynous", "successful": null, "addressesentered": null, "gpg45scores": null, "levelofconfidence": null, "cifail": null, "hasmitigations": null, "reason": null, "rejectionreason": null, "reprove_identity": null, "experianiiqresponse": { "outcome": "Virginia", "totalquestionsansweredcorrect": "Keyboard", "totalquestionsansweredincorrect": "ASCII", "totalquestionsasked": "Niobium" }, "mitigation_type": null, "isukissued": null, "age": null}`;
// Parse the string into an object
const data: Data = JSON.parse(jsonString);
// Extract decisionscore
const decisionscore: string = data.evidence.decisionscore;
console.log('decisionscore:', decisionscore);
