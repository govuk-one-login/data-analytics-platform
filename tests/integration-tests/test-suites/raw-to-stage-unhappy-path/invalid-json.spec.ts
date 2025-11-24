import { uploadEventToRawLayer, deleteEventFromRawLayer } from '../../helpers/aws/s3/upload-to-s3';
import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { generateTimestamp, generateTimestampFormatted, generateTimestampInMs } from '../../helpers/utils/utils';
import { executeStepFunction } from '../../helpers/aws/step-function/execute-step-function';
import { fetchGlueErrorLogs } from '../../helpers/aws/cloudwatch/fetch-glue-logs';
import { retryOnConcurrentRun } from '../../helpers/utils/retry-on-concurrent-run';
import { constructCreateAccountDeformedJsonTxmaEvent } from '../../test-events/unhappy-path-events/invalid-json-txma-event';
import { constructInvalidExtensionsEvent } from '../../test-events/unhappy-path-events/invalid-json-extensions-event';
import { constructCreateAccountDeformedJsonUserEvent } from '../../test-events/unhappy-path-events/invalid-json-user-event';

describe('Invalid JSON Tests', () => {
  let uploadedEventId: string | undefined;

  test.each([
    ['txma field', constructCreateAccountDeformedJsonTxmaEvent],
    ['extensions field', constructInvalidExtensionsEvent],
    ['user field', constructCreateAccountDeformedJsonUserEvent],
  ])(
    'Event with deformed JSON for %s causes ETL job to fail',
    async (_, eventConstructor) => {
      const invalidEvent = eventConstructor(
        generateTimestamp(),
        generateTimestampFormatted(),
        generateTimestampInMs(),
        generateTimestampFormatted(),
        'testClientId',
        'testUserId',
        'testJourneyId',
      );
      uploadedEventId = invalidEvent.event_id as string;

      // eslint-disable-next-line no-console
      console.log(`\n📝 Testing: ${_}`);
      // eslint-disable-next-line no-console
      console.log('📤 Uploading invalid event to S3...');
      await uploadEventToRawLayer(invalidEvent);

      const rawToStageStepFunction = getIntegrationTestEnv('RAW_TO_STAGE_STEP_FUNCTION');
      const testStartTime = Date.now();

      // eslint-disable-next-line no-console
      console.log('⚙️ Executing step function (expecting failure)...');

      await retryOnConcurrentRun(async () => {
        try {
          await executeStepFunction(rawToStageStepFunction, undefined, `unhappy-path-${uploadedEventId}`);
          throw new Error('Step function should have failed but succeeded');
        } catch (error) {
          const executionDetails = JSON.parse((error as Error).message);

          if (executionDetails.status !== 'FAILED') {
            throw new Error(`Expected FAILED status, got: ${executionDetails.status}`);
          }

          // eslint-disable-next-line no-console
          console.log('✓ Step function failed as expected');

          if (executionDetails.glueJobId) {
            // eslint-disable-next-line no-console
            console.log('🔍 Fetching ERROR logs...');
            const logGroupName = getIntegrationTestEnv('GLUE_LOG_GROUP');
            const logs = await fetchGlueErrorLogs(logGroupName, executionDetails.glueJobId, testStartTime);
            const expectedError = 'Exception Error within function parse_json';
            if (!logs.includes(expectedError)) {
              throw new Error(`Expected error message not found in logs:\n${logs}`);
            }
            // eslint-disable-next-line no-console
            console.log(`✓ Found expected error message: "${expectedError}"`);
          }
        }
      });
    },
    300 * 1000, // 5 minute timeout for step function failure
  );

  afterEach(async () => {
    if (uploadedEventId) {
      // eslint-disable-next-line no-console
      console.log(`🧹 Cleaning up event ${uploadedEventId}...`);
      await deleteEventFromRawLayer(uploadedEventId);
      uploadedEventId = undefined;
    }
    // Wait 10s between tests to reduce concurrent Glue runs
    await new Promise(resolve => setTimeout(resolve, 10000));
  });
});
