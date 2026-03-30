import {
  sharedSsmMappings,
  setEnvVarsFromSsm,
  formatTestStackSsmParam,
} from '../../../shared-test-code/config/ssm-config';

const integrationSsmMappings = {
  ...sharedSsmMappings,
  DAP_TXMA_CONSUMER_SQS_QUEUE_URL: formatTestStackSsmParam('dapTXMAConsumerSQSQueueUrl'),
  GLUE_LOG_GROUP: formatTestStackSsmParam('glueLogGroup'),
};

export const setIntegrationEnvVarsFromSsm = async () => setEnvVarsFromSsm(integrationSsmMappings);
