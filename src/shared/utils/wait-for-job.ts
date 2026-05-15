import { sleep } from './utils';

export interface WaitForJobConfig<T> {
  statusGetter: () => Promise<T>;
  statusStringGetter: (t: T) => string | undefined;
  successStatuses: string[];
  failureStatuses: string[];

  timeoutMs?: number;
  timeoutStepMs?: number;
  onError?: (t: T | undefined) => void;
}

export const waitForJob = async <T>(config: WaitForJobConfig<T>): Promise<T> => {
  const timeoutMs = config.timeoutMs ?? 120 * 1000;
  const timeoutStepMs = config.timeoutStepMs ?? 200;

  let timeRemaining = timeoutMs;
  let response: T | undefined;
  let status: string | undefined;

  while (timeRemaining > 0) {
    response = await config.statusGetter();
    status = config.statusStringGetter(response);
    // return if one of the successful statuses, break if one of the failed ones to allow error to be thrown
    // we do nothing for other possible statuses as we want to continue waiting
    if (config.successStatuses.includes(status)) {
      return response;
    } else if (config.failureStatuses.includes(status)) {
      break;
    }
    timeRemaining -= timeoutStepMs;
    await sleep(timeoutStepMs);
  }
  if (config.onError !== undefined) {
    config.onError.call(null, response);
  }
  throw new Error(`Job did not complete in ${timeoutMs}ms - final status was ${status}`);
};
