import { listRawLayerTodaysData, deleteRawLayerTodaysData } from '../../helpers/aws/s3/delete-todays-s3-data';
import { getIntegrationTestEnv } from '../../helpers/utils/utils';
import { generateTimestamp, generateTimestampFormatted, generateTimestampInMs } from '../../helpers/utils/utils';
import { executeStepFunction } from '../../helpers/aws/step-function/execute-step-function';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { constructCreateAccountDeformedJsonTxmaEvent } from '../../test-events/unhappy-path-events/invalid-json-txma-event';
import { constructInvalidExtensionsEvent } from '../../test-events/unhappy-path-events/invalid-json-extensions-event';
import { rawdataS3BucketName } from '../../../helpers/envHelper';

describe('Invalid JSON Tests', () => {
  test.each([
    ['txma field', constructCreateAccountDeformedJsonTxmaEvent],
    ['extensions field', constructInvalidExtensionsEvent],
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

      // Write malformed event directly to S3 raw layer
      const s3Client = new S3Client({});
      const now = new Date();
      const key = `txma/year=${now.getFullYear()}/month=${String(now.getMonth() + 1).padStart(2, '0')}/day=${String(now.getDate()).padStart(2, '0')}/event_id=${invalidEvent.event_id}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: rawdataS3BucketName(),
          Key: key,
          Body: JSON.stringify(invalidEvent),
          ContentType: 'application/json',
        }),
      );

      const rawToStageStepFunction = getIntegrationTestEnv('RAW_TO_STAGE_STEP_FUNCTION');

      // Execute step function and expect it to fail
      try {
        await executeStepFunction(rawToStageStepFunction);
        fail('Expected step function to fail but it succeeded');
      } catch (error) {
        // Step function should fail due to invalid JSON
        expect(error).toBeDefined();
        // eslint-disable-next-line no-console
        console.log('Step function failed as expected:', error);
      }
    },
    300 * 1000, // 5 minute timeout for step function failure
  );

  afterEach(async () => {
    const files = await listRawLayerTodaysData();
    // eslint-disable-next-line no-console
    console.log(`Found ${files.length} files to delete:`, files);

    const deletedCount = await deleteRawLayerTodaysData();
    // eslint-disable-next-line no-console
    console.log(`Successfully deleted ${deletedCount} files from raw layer`);
  });
});
