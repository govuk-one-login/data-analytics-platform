import { uploadEventToRawLayer, deleteEventFromRawLayer } from '../../helpers/aws/s3/upload-to-s3';
import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { generateTimestamp, generateTimestampFormatted, generateTimestampInMs } from '../../helpers/utils/utils';
import { executeStepFunction } from '../../helpers/aws/step-function/execute-step-function';
import { fetchGlueErrorLogs } from '../../helpers/aws/cloudwatch/fetch-glue-logs';
import { retryOnConcurrentRun } from '../../helpers/utils/retry-on-concurrent-run';
import { constructCreateAccountDeformedJsonTxmaEvent } from '../../test-events/raw-to-stage-unhappy-path-events/invalid-json-txma-event';
import { constructInvalidExtensionsEvent } from '../../test-events/raw-to-stage-unhappy-path-events/invalid-json-extensions-event';
import { constructCreateAccountDeformedJsonUserEvent } from '../../test-events/raw-to-stage-unhappy-path-events/invalid-json-user-event';

describe('Invalid JSON Tests', () => {
  let uploadedEventId: string | undefined;

  test.each([
    ['txma field', constructCreateAccountDeformedJsonTxmaEvent],
    ['extensions field', constructInvalidExtensionsEvent],
    ['user field', constructCreateAccountDeformedJsonUserEvent],
  ])(
    'Event with deformed JSON for %s causes ETL job to fail',
    async (fieldDescription, eventConstructor) => {
      const fieldName = fieldDescription.replace(' field', '').replace(' ', '');
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
      const testStartTime = Date.now();

      await uploadEventToRawLayer(invalidEvent);

      const rawToStageStepFunction = getIntegrationTestEnv('RAW_TO_STAGE_STEP_FUNCTION');

      await retryOnConcurrentRun(async () => {
        let executionDetails;
        try {
          await executeStepFunction(rawToStageStepFunction, undefined, `unhappy-path-${fieldName}-${uploadedEventId}`);
          throw new Error('Step function should have failed but succeeded');
        } catch (error) {
          const errorMessage = (error as Error).message;

          // Let ConcurrentRunsExceededException bubble up for retry
          if (errorMessage.includes('ConcurrentRunsExceededException')) {
            throw error;
          }

          executionDetails = JSON.parse(errorMessage);
        }

        // Verify step function failed with States.TaskFailed
        if (executionDetails.status !== 'FAILED') {
          throw new Error(`Expected FAILED status, got: ${executionDetails.status}`);
        }
        if (executionDetails.error !== 'States.TaskFailed') {
          throw new Error(`Expected States.TaskFailed error, got: ${executionDetails.error}`);
        }

        // Verify Glue job ran and fetch logs
        if (!executionDetails.glueJobId) {
          throw new Error('No Glue job ID found - job may not have executed');
        }

        const logGroupName = getIntegrationTestEnv('GLUE_LOG_GROUP');
        const logs = await fetchGlueErrorLogs(logGroupName, executionDetails.glueJobId, testStartTime);
        const expectedError = 'Exception Error within function parse_json';
        if (!logs.includes(expectedError)) {
          throw new Error(`Expected error message not found in logs:\n${logs}`);
        }
      });
    },
    300 * 1000, // 5 minute timeout for step function failure
  );

  afterEach(async () => {
    if (uploadedEventId) {
      await deleteEventFromRawLayer(uploadedEventId);
      uploadedEventId = undefined;
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
  }, 30000);
});
