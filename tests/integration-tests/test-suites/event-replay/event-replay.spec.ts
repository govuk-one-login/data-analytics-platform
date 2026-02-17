import { addMessageToQueue } from '../../helpers/aws/sqs/add-message-to-queue';
import { executeGlueJob } from '../../helpers/aws/glue/execute-glue-job';
import { executeAthenaQuery } from '../../helpers/aws/athena/execute-athena-query';
import { executeRedshiftQuery } from '../../helpers/aws/redshift/execute-redshift-query';
import { executeStepFunction } from '../../helpers/aws/step-function/execute-step-function';
import { pollForRawLayerReplayData } from '../../helpers/utils/poll-for-athena-data';
import { pollForFactJourneyData } from '../../helpers/utils/poll-for-redshift-data';
import { uploadReplayConfigToS3 } from '../../helpers/aws/s3/upload-replay-config';
import {
  getIntegrationTestEnv,
  generateTimestamp,
  generateTimestampFormatted,
  generateTimestampInMs,
} from '../../helpers/utils/utils';
import {
  constructReplayTestEventWithAdditionalExtensions,
  constructReplayTestEventExpectedConformedData,
  constructReplayTestEventExpectedConformedDataAfterReplay,
} from '../../test-events/replay-events/replay-event';

const eventId = (global as { replayEventId?: string }).replayEventId!;
let replayId: string;

describe('Event Replay Integration Test', () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const expectedInitialConformedData = constructReplayTestEventExpectedConformedData(eventId, date);
  const expectedReplayConformedData = constructReplayTestEventExpectedConformedDataAfterReplay(eventId, date, replayId);

  test('Initial event appears in conform layer with expected extensions', async () => {
    const factQuery = `
      SELECT f.event_id, f.component_id
      FROM "dap_txma_reporting_db_refactored"."conformed_refactored"."fact_user_journey_event_refactored" f
      WHERE f.event_id = '${eventId}'
    `;
    const factResults = await executeRedshiftQuery(factQuery);
    expect(factResults).toHaveLength(1);
    expect(factResults[0].event_id).toBe(expectedInitialConformedData.fact.event_id);
    expect(factResults[0].component_id).toBe(expectedInitialConformedData.fact.component_id);

    const extensionsQuery = `
      SELECT parent_attribute_name, event_attribute_name, event_attribute_value
      FROM "dap_txma_reporting_db_refactored"."conformed_refactored"."event_extensions_refactored"
      WHERE event_id = '${eventId}'
    `;
    const extensionsResults = await executeRedshiftQuery(extensionsQuery);
    expect(extensionsResults.length).toBe(expectedInitialConformedData.extensions.length);
    expect(extensionsResults).toEqual(expect.arrayContaining(expectedInitialConformedData.extensions));
  }, 30000);

  test(
    'Event replay updates stage and conform layers with additional extensions',
    async () => {
      const queueUrl = getIntegrationTestEnv('DAP_TXMA_CONSUMER_SQS_QUEUE_URL');
      const timestamp = generateTimestamp();
      const timestamp_formatted = generateTimestampFormatted();
      const event_timestamp_ms = generateTimestampInMs();
      const event_timestamp_ms_formatted = generateTimestampFormatted();

      await new Promise(resolve => setTimeout(resolve, 75000));

      const replayEventToSend = constructReplayTestEventWithAdditionalExtensions(
        timestamp,
        timestamp_formatted,
        event_timestamp_ms,
        event_timestamp_ms_formatted,
        eventId,
      );

      await addMessageToQueue(replayEventToSend, queueUrl);
      replayId = (replayEventToSend.txma as { event_replay: { replay_id: string } }).event_replay.replay_id;

      await new Promise(resolve => setTimeout(resolve, 15000));
      await pollForRawLayerReplayData([replayId], { maxWaitTimeMs: 2 * 60 * 1000 });

      const metadataBucket = getIntegrationTestEnv('RAW_LAYER_BUCKET').replace('-dap-raw-layer', '-dap-elt-metadata');
      const stageDatabase = getIntegrationTestEnv('STAGE_LAYER_DATABASE');
      const env = stageDatabase.split('-')[0];
      const glueJobName = `${env}-dap-raw-stage-transform-process`;

      await uploadReplayConfigToS3(metadataBucket, replayId);
      await executeGlueJob(glueJobName, {
        '--config_key_path': 'txma/raw_stage_optimisation_solution/configuration_rules/raw_to_stage_replay_config.json',
      });

      const stageQuery = `SELECT * FROM "${stageDatabase}"."txma_stage_layer" WHERE event_id = '${eventId}'`;
      const stageResults = await executeAthenaQuery(stageQuery, stageDatabase);
      expect(stageResults.length).toBeGreaterThan(0);

      const stageToConformStepFunction = getIntegrationTestEnv('STAGE_TO_CONFORM_STEP_FUNCTION');
      await executeStepFunction(stageToConformStepFunction, undefined, 'replay-stage-to-conform');
      await pollForFactJourneyData([eventId], { maxWaitTimeMs: 2 * 60 * 1000 });

      const countQuery = `
        SELECT COUNT(*) as count
        FROM "dap_txma_reporting_db_refactored"."conformed_refactored"."fact_user_journey_event_refactored"
        WHERE event_id = '${eventId}'
      `;
      const countResults = await executeRedshiftQuery(countQuery);
      expect(countResults[0].count).toBe(1);

      const extensionsQuery = `
        SELECT parent_attribute_name, event_attribute_name, event_attribute_value
        FROM "dap_txma_reporting_db_refactored"."conformed_refactored"."event_extensions_refactored"
        WHERE event_id = '${eventId}'
        ORDER BY event_attribute_name
      `;
      const extensionsResults = await executeRedshiftQuery(extensionsQuery);
      expect(extensionsResults.length).toBe(expectedReplayConformedData.extensions.length);
      expect(extensionsResults).toEqual(expect.arrayContaining(expectedReplayConformedData.extensions));
    },
    10 * 60 * 1000,
  );
});
