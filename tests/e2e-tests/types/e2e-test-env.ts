import { SharedTestEnvName } from '../../shared-test-code/types/test-env';

export type E2ETestEnvName = SharedTestEnvName | 'DAP_E2E_TEST_PRODUCER_QUEUE_URL' | 'OBFUSCATION_HMAC_SECRET_ARN';
