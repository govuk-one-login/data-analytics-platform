import { getQueryResults } from '../helpers/db-helpers';
import { GET_EVENT_IDS, raw_txma_no_extensions, stage_txma_stage_layer_no_extensions } from '../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaRawDatabaseName, txmaStageDatabaseName } from '../helpers/envHelper';
import { eventidlist } from '../helpers/common-helpers';

describe('Simple event Test - validate data at stage layer', () => {
  test.concurrent.each`
    eventName                    
    ${'AUTH_CREATE_ACCOUNT'}
    ${'AUTH_CHECK_USER_NO_ACCOUNT_WITH_EMAIL'}
    ${'AUTH_PASSWORD_RESET_SUCCESSFUL'}
    ${'AUTH_ACCOUNT_TEMPORARILY_LOCKED'}
    ${'AUTH_REAUTHENTICATION_INVALID'}
    ${'AUTH_DOC_APP_AUTHORISATION_REQUESTED'}
    ${'DCMAW_READID_NFC_BILLING_STARTED'}
    ${'DCMAW_CRI_END'}
    ${'DCMAW_MISSING_CONTEXT_AFTER_COMPLETION'}
    ${'DCMAW_MISSING_CONTEXT_AFTER_ABORT'}
    ${'DCMAW_IPROOV_BILLING_STARTED'}
    ${'DCMAW_HYBRID_BILLING_STARTED'}
    ${'DCMAW_CRI_5XXERROR'}
    ${'DCMAW_REDIRECT_SUCCESS'}
    ${'DCMAW_ABORT_WEB'}
    ${'DCMAW_REDIRECT_ABORT'}
    ${'DCMAW_ABORT_APP'}
    ${'DCMAW_CRI_4XXERROR'}
    ${'IPV_ADDRESS_CRI_END'}
    ${'IPV_ADDRESS_CRI_REQUEST_SENT'}
    ${'CIC_CRI_AUTH_CODE_ISSUED'}
    ${'CIC_CRI_START'}
    ${'CIC_CRI_VC_ISSUED'}
    ${'IPV_DL_CRI_REQUEST_SENT'}
    ${'IPV_DL_CRI_RESPONSE_RECEIVED'}
    ${'IPV_DL_CRI_END'}
    ${'F2F_YOTI_PDF_EMAILED'}
    ${'F2F_CRI_START'}
    ${'IPR_RESULT_NOTIFICATION_EMAILED'}
    ${'F2F_CRI_AUTH_CODE_ISSUED'}
    ${'F2F_YOTI_START'}
    ${'IPV_F2F_CRI_VC_CONSUMED'}
    ${'F2F_YOTI_RESPONSE_RECEIVED'}
    ${'IPR_USER_REDIRECTED'}
    ${'IPV_FRAUD_CRI_THIRD_PARTY_REQUEST_ENDED'}
    ${'IPV_FRAUD_CRI_END'}
    ${'IPV_FRAUD_CRI_RESPONSE_RECEIVED'}
    ${'IPV_KBV_CRI_RESPONSE_RECEIVED'}
    ${'IPV_KBV_CRI_END'}
    ${'IPV_KBV_CRI_REQUEST_SENT'}
    ${'IPV_PASSPORT_CRI_END'}
    ${'IPV_PASSPORT_CRI_RESPONSE_RECEIVED'}
    ${'IPV_PASSPORT_CRI_REQUEST_SENT'}
    ${'IPV_SPOT_REQUEST_VALIDATION_FAILURE'}
    ${'IPV_CRI_AUTH_RESPONSE_RECEIVED'}
    ${'IPV_MITIGATION_START'}
    ${'IPV_CORE_CRI_RESOURCE_RETRIEVED'}
    ${'IPV_SPOT_REQUEST_RECEIVED'}
    ${'IPV_REDIRECT_TO_CRI'}
    ${'IPV_DELETE_USER_DATA'}

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
        const query = `${raw_txma_no_extensions} where event_id in (${querystring})`;
        const athenaRawQueryResults = await getQueryResults(
          query,
          txmaRawDatabaseName(),
          txmaProcessingWorkGroupName(),
        );
        for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
          const eventId = athenaRawQueryResults[index].event_id;
          const queryStage = `${stage_txma_stage_layer_no_extensions} where  event_id = '${eventId}'`;
          const athenaQueryStageResults: unknown = await getQueryResults(
            queryStage,
            txmaStageDatabaseName(),
            txmaProcessingWorkGroupName(),
          );
          expect(athenaRawQueryResults[index].client_id).toEqual(athenaQueryStageResults[0].client_id);
          expect(athenaRawQueryResults[index].component_id).toEqual(athenaQueryStageResults[0].component_id);
          const cleanedString = athenaRawQueryResults[index].user.replace(/[{}]/g, '');

          // Split the string into key-value pairs
          const keyValuePairs = cleanedString.split(',');

          // Initialize a variable to store the value of user_govuk_signin_journey_id
          let userGovukSigninJourneyId: string | undefined;
          let userId: string | undefined;

          // Iterate over each key-value pair
          keyValuePairs.forEach(pair => {
            // Split each pair into key and value
            const [key, value] = pair.split('=');
            // Remove leading and trailing whitespace
            const cleanKey = key.trim();
            const cleanValue = value.trim();

            // Check if the key is 'user_govuk_signin_journey_id'
            if (cleanKey === 'govuk_signin_journey_id') {
              // Store the value
              userGovukSigninJourneyId = cleanValue;
            }

            if (cleanKey === 'user_id') {
              // Store the value
              userId = cleanValue;
            }
          });
          expect(userGovukSigninJourneyId).toEqual(athenaQueryStageResults[0].user_govuk_signin_journey_id);
          expect(userId).toEqual(athenaQueryStageResults[0].user_user_id);
        }
      }
    },
    240000,
  );
});
