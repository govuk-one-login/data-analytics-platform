import { Logger } from '@aws-lambda-powertools/logger';
import { getAWSEnvironment } from './utils/utils';
import { Metrics } from '@aws-lambda-powertools/metrics';

const environment = getAWSEnvironment();

export const getLogger = (serviceName: string): Logger => {
  return new Logger({ environment, serviceName, persistentLogAttributes: { environment } });
};

export const getLoggerAndMetrics = (serviceName: string): { logger: Logger; metrics: Metrics } => {
  const metrics = new Metrics({ namespace: 'dap', serviceName, defaultDimensions: { environment } });
  return { logger: getLogger(serviceName), metrics };
};
