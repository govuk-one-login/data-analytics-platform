import { STACK_NAME } from '../../../shared-test-code/constants';
import { retrieveSsmParameterValue } from '../aws/ssm/retrieve-ssm-parameter-value';

const formatTestStackSsmParam = (parameterName: string) => `/tests/${STACK_NAME}/${parameterName}`;

const ssmMappings = {
  DAP_TXMA_CONSUMER_SQS_QUEUE_URL: formatTestStackSsmParam('dapTXMAConsumerSQSQueueUrl'),
  ATHENA_WORKGROUP: formatTestStackSsmParam('dapAthenaWorkgroup'),
  RAW_LAYER_DATABASE: formatTestStackSsmParam('dapAthenaRawLayerDatabase'),
  RAW_LAYER_BUCKET: formatTestStackSsmParam('dapRawLayerBucket'),
  STAGE_LAYER_DATABASE: formatTestStackSsmParam('dapAthenaStageLayerDatabase'),
  RAW_TO_STAGE_STEP_FUNCTION: formatTestStackSsmParam('rawToStageStepFunction'),
  GLUE_LOG_GROUP: formatTestStackSsmParam('glueLogGroup'),
  REDSHIFT_SECRET_ARN: formatTestStackSsmParam('redshiftSecretArn'),
  REDSHIFT_WORKGROUP_NAME: formatTestStackSsmParam('redshiftWorkgroupName'),
};

export const setEnvVarsFromSsm = async (mappings: Record<string, string> = ssmMappings) => {
  for (const [k, v] of Object.entries(mappings)) {
    if (!process.env[k]) {
      try {
        const value = await retrieveSsmParameterValue(v, 'eu-west-2');
        if (!value) {
          throw new Error(`SSM parameter ${v} returned empty value`);
        }
        process.env[k] = value;
      } catch (error) {
        throw new Error(`Failed to retrieve SSM parameter ${v} for ${k}: ${error}`);
      }
    }
  }

  // Validate all required environment variables are now set
  const missingVars = Object.keys(mappings).filter(key => !process.env[key]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables after SSM setup: ${missingVars.join(', ')}`);
  }
};
