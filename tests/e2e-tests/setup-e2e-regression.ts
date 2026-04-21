/* eslint-disable no-console */
import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { addMessageToQueue } from '../shared-test-code/aws/sqs/add-message-to-queue';
import { executeStepFunction } from '../shared-test-code/aws/step-function/execute-step-function';
import { pollForRawLayerData, pollForStageLayerData } from '../shared-test-code/poll-for-athena-data';
import { pollForFactJourneyData } from '../shared-test-code/poll-for-redshift-data';
import { grantRedshiftAccess } from '../shared-test-code/aws/redshift/grant-access';
import { setE2EEnvVarsFromSsm } from './helpers/config/ssm-config';
import { getE2ETestEnv } from './helpers/utils/utils';
import { regressionTestConfig } from './config/e2e-regression.config';
import { AuditEvent } from '../../common/types/event';
import { randomUUID } from 'node:crypto';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

export default async function globalSetup() {
  const setupStartTime = Date.now();

  try {
    process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
    process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

    await setE2EEnvVarsFromSsm();
    await grantRedshiftAccess(getE2ETestEnv('REDSHIFT_WORKGROUP_NAME'));

    const queueUrl = getE2ETestEnv('DAP_E2E_TEST_PRODUCER_QUEUE_URL');
    const hmacSecretArn = getE2ETestEnv('OBFUSCATION_HMAC_SECRET_ARN');

    const secretsManager = new SecretsManagerClient({ region: AWS_REGION });
    const secret = await secretsManager.send(new GetSecretValueCommand({ SecretId: hmacSecretArn }));
    const hmacKey = secret.SecretString;
    console.log('🔑 Retrieved obfuscation HMAC key from Secrets Manager');

    const now = new Date();
    const eventId = randomUUID();
    const timestamp = Math.floor(now.getTime() / 1000);
    const expectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const event = {
      ...regressionTestConfig.event,
      event_id: eventId,
      timestamp,
      event_timestamp_ms: now.getTime(),
    } as unknown as AuditEvent;

    await addMessageToQueue(event, queueUrl);
    console.log(`📤 Sent event:`, JSON.stringify(event, null, 2));

    console.log('⏳ Waiting 10 mins before polling...');
    const rawPollStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));

    console.log('⏳ Polling for event in raw layer (up to 15 mins)...');
    await pollForRawLayerData([eventId], { maxWaitTimeMs: 15 * 60 * 1000, pollIntervalMs: 10000 });
    console.log(`✅ Event found in raw layer after ${Math.round((Date.now() - rawPollStart) / 1000)}s`);

    const rawToStageStepFunction = getE2ETestEnv('RAW_TO_STAGE_STEP_FUNCTION');
    await executeStepFunction(rawToStageStepFunction, undefined, 'e2e-regression', 25 * 60 * 1000);
    await pollForStageLayerData([eventId], { maxWaitTimeMs: 10 * 60 * 1000, pollIntervalMs: 10000 });
    await pollForFactJourneyData([eventId], { maxWaitTimeMs: 5 * 60 * 1000, pollIntervalMs: 5000 });

    (global as { regressionEventId?: string }).regressionEventId = eventId;
    (global as { regressionExpectedDate?: string }).regressionExpectedDate = expectedDate;
    (global as { regressionHmacKey?: string }).regressionHmacKey = hmacKey;
    (global as { regressionEventTimestampMs?: number }).regressionEventTimestampMs = now.getTime();

    const totalSetupDuration = Date.now() - setupStartTime;
    (global as { regressionSetupDurationMs?: number }).regressionSetupDurationMs = totalSetupDuration;
    console.log(`🎉 E2E regression setup completed in ${Math.round(totalSetupDuration / 1000)}s`);
  } catch (error) {
    const setupDuration = Date.now() - setupStartTime;
    console.error(`❌ E2E regression setup failed after ${Math.round(setupDuration / 1000)}s:`, error);
    throw error;
  }
}
