import {
  sharedSsmMappings,
  setEnvVarsFromSsm,
  formatTestStackSsmParam,
} from '../../../shared-test-code/config/ssm-config';

const e2eSsmMappings = {
  ...sharedSsmMappings,
  DAP_E2E_TEST_PRODUCER_QUEUE_URL: formatTestStackSsmParam('dapE2ETestProducerQueueUrl'),
  OBFUSCATION_HMAC_SECRET_ARN: formatTestStackSsmParam('obfuscationHmacSecretArn'),
};

export const setE2EEnvVarsFromSsm = async () => setEnvVarsFromSsm(e2eSsmMappings);
