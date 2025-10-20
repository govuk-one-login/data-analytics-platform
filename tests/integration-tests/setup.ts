import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';
import { retrieveSsmParameterValue } from './helpers/aws/ssm/retrieveSsmParameterValue';

export default async () => {
  process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
  process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;
  await setEnvVarsFromSsm(ssmMappings);
};

const formatTestStackSsmParam = (parameterName: string) => `/tests/${STACK_NAME}/${parameterName}`;

const ssmMappings = {
  DAP_TXMA_CONSUMER_SQS_QUEUE_URL: formatTestStackSsmParam('dapTXMAConsumerSQSQueueUrl'),
  ATHENA_WORKGROUP: formatTestStackSsmParam('dapAthenaWorkgroup'),
  RAW_LAYER_DATABASE: formatTestStackSsmParam('dapAthenaRawLayerDatabase'),
  STAGE_LAYER_DATABASE: formatTestStackSsmParam('dapAthenaStageLayerDatabase'),
  RAW_TO_STAGE_STEP_FUNCTION: formatTestStackSsmParam('rawToStageStepFunction'),
};

const setEnvVarsFromSsm = async (ssmMappings: Record<string, string>) => {
  for (const [k, v] of Object.entries(ssmMappings)) {
    process.env[k] = process.env[k] ? process.env[k] : await retrieveSsmParameterValue(v, 'eu-west-2');
  }
};
