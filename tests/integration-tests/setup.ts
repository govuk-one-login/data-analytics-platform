import { getEnv } from '../../common/utilities/helpers/getEnv'
import { retrieveSsmParameterValue } from '../sharedTestCode/setup/retrieveSsmParameterValues'
import { setEnvVarsFromSecretsManager } from '../sharedTestCode/setup/setEnvVarsFromSecretsManager'
import { setEnvVarsFromStackOutputs } from '../sharedTestCode/setup/setEnvVarsFromStackOutputs'
import { AWS_REGION, STACK_NAME } from '../sharedTestCode/testConstants'

module.exports = async () => {
  const stackName = process.env.STACK_NAME ?? STACK_NAME;
  process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;

  const formatTestStackSsmParam = (parameterName: string) => `/tests/${parameterName}`;

  const ssmMappings = {
    DYNAMO_OPERATIONS_FUNCTION_NAME: formatTestStackSsmParam(
      'DynamoOperationsFunctionName'
    )
  }

  const setEnvVarsFromSsm = async (ssmMappings: Record<string, string>) => {
    for (const [k, v] of Object.entries(ssmMappings)) {
      process.env[k] = process.env[k]
        ? process.env[k]
        : await retrieveSsmParameterValue(v, getEnv('AWS_REGION'))
    }
  }

  await setEnvVarsFromStackOutputs(stackName, getEnv('AWS_REGION'), {
    EVENT_PROCESSOR_FUNCTION_NAME: 'EventProcessorFunctionName',
    EVENT_PROCESSOR_LOG_GROUP_NAME: 'EventProcessorLogGroupName',
    EVENT_ENRICHMENT_FUNCTION_NAME: 'EventEnrichmentFunctionName',
    EVENT_ENRICHMENT_LOG_GROUP_NAME: 'EventEnrichmentLogGroupName',
    EVENT_ENRICHMENT_ENABLED: 'EventEnrichmentEnabled',
    EVENT_ENRICHMENT_MAX_RETRIES: 'EventEnrichmentMaxRetries',
    USER_JOURNEYID_CACHE_TABLE_NAME: 'UserJourneyIdCacheTableName',
    FRAUD_SPLUNK_DELIVERY_TEST_BUCKET_NAME: 'FraudSplunkDeliveryTestBucketName',
    FRAUD_SPLUNK_TRANSFORMATION_LOG_GROUP_NAME:
      'FraudSplunkTransformationLogGroupName',
    PERFORMANCE_SPLUNK_DELIVERY_TEST_BUCKET_NAME:
      'PerformanceSplunkDeliveryTestBucketName',
    PERFORMANCE_SPLUNK_TRANSFORMATION_LOG_GROUP_NAME:
      'PerformanceSplunkTransformationLogGroupName',
    CACHE_TABLE_NAME: 'UserJourneyIdCacheTableName',
    EVENT_VALIDATION_LOG_GROUP_NAME: 'EventValidationLogGroupName',
    EVENT_VALIDATION_FUNCTION_NAME: 'EventValidationFunctionName'
  })
  await setEnvVarsFromSecretsManager(getEnv('AWS_REGION'), {
    FRAUD_HMAC_KEY: `tests/event-processing/FraudHMACKey`,
    PERFORMANCE_HMAC_KEY: `tests/event-processing/PerformanceHMACKey`
  })

  await setEnvVarsFromSsm(ssmMappings)
}
