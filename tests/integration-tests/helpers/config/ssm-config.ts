import {
  sharedSsmMappings,
  setEnvVarsFromSsm,
  formatTestStackSsmParam,
} from '../../../shared-test-code/config/ssm-config';

const integrationSsmMappings = {
  ...sharedSsmMappings,
  DAP_TXMA_CONSUMER_SQS_QUEUE_URL: formatTestStackSsmParam('dapTXMAConsumerSQSQueueUrl'),
  DAP_TXMA_CONSUMER_DLQ_URL: formatTestStackSsmParam('dapTXMAConsumerDLQUrl'),
  GLUE_LOG_GROUP: formatTestStackSsmParam('glueLogGroup'),
};

export const setIntegrationEnvVarsFromSsm = async () => setEnvVarsFromSsm(integrationSsmMappings);
