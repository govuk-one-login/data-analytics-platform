import { SharedTestEnvName } from '../../shared-test-code/types/test-env';

export type IntegrationTestEnvName = SharedTestEnvName | 'DAP_TXMA_CONSUMER_SQS_QUEUE_URL' | 'GLUE_LOG_GROUP';
