import { getTestEnv } from '../../../shared-test-code/utils/get-test-env';
import { E2ETestEnvName } from '../../types/e2e-test-env';

export const getE2ETestEnv = (name: E2ETestEnvName): string => getTestEnv(name);
