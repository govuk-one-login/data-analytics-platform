export interface IntegrationTestEnv {
  name:
    | 'AWS_REGION'
    | 'DAP_TXMA_CONSUMER_SQS_QUEUE_URL'
    | 'STACK_NAME'
    | 'ATHENA_WORKGROUP'
    | 'RAW_LAYER_DATABASE'
    | 'STAGE_LAYER_DATABASE'
    | 'RAW_TO_STAGE_STEP_FUNCTION';
}
