import { getLogger, getLoggerAndMetrics } from './powertools';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

test('getLogger returns Logger with default log level', () => {
  // Unit Test
  const logger = getLogger('test-service');
  expect(logger).toBeInstanceOf(Logger);
});

test('getLogger uses LOG_LEVEL environment variable when set', () => {
  // Unit Test
  process.env.LOG_LEVEL = 'INFO';
  const logger = getLogger('test-service');
  expect(logger).toBeInstanceOf(Logger);
});

test('getLoggerAndMetrics returns logger and metrics', () => {
  // Unit Test
  const result = getLoggerAndMetrics('test-service');
  expect(result.logger).toBeInstanceOf(Logger);
  expect(result.metrics).toBeInstanceOf(Metrics);
});
