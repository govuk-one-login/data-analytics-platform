// Polling intervals and timeouts
export const DEFAULT_POLL_INTERVAL_MS = 5000; // 5 seconds between polls
export const DEFAULT_MAX_WAIT_TIME_MS = 5 * 60 * 1000; // 5 minutes max wait time
export const STEP_FUNCTION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes for step function execution
export const GLUE_JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes for Glue job execution
export const ABORT_WAIT_TIME_MS = 10000; // 10 seconds wait after aborting executions

// Step Function execution statuses
export const STEP_FUNCTION_STATUS_RUNNING = 'RUNNING';
export const STEP_FUNCTION_STATUS_SUCCEEDED = 'SUCCEEDED';
export const STEP_FUNCTION_STATUS_FAILED = 'FAILED';

// Glue job statuses
export const GLUE_JOB_STATUS_RUNNING = 'RUNNING';
export const GLUE_JOB_STATUS_SUCCEEDED = 'SUCCEEDED';
