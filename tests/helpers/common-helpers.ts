import { describeExecution } from './step-helpers';
const formatNumberInTwoDigits = (num: number): string => {
  return `0${num}`.slice(-2);
};

export const getEventFilePrefix = (eventName: string): string => {
  const today = new Date();
  return `txma/${eventName}/year=${today.getFullYear()}/month=${formatNumberInTwoDigits(
    today.getMonth() + 1,
  )}/day=${formatNumberInTwoDigits(today.getDate())}`;
};

export const getEventFilePrefixDayBefore = (eventName: string): string => {
  const today = new Date();
  return `txma/${eventName}/year=${today.getFullYear()}/month=${formatNumberInTwoDigits(
    today.getMonth() + 1,
  )}/day=${formatNumberInTwoDigits(today.getDate() - 1)}`;
};

export const getErrorFilePrefix = (): string => {
  const today = new Date();
  return `kinesis-processing-errors-metadata-extraction-failed/${today.getFullYear()}/${formatNumberInTwoDigits(
    today.getMonth() + 1,
  )}/${formatNumberInTwoDigits(today.getDate())}`;
};

export const poll = async <Resolution>(
  promise: () => Promise<Resolution>,
  completionCondition: (resolution: Resolution) => boolean,
  options?: {
    interval?: number;
    timeout?: number;
    nonCompleteErrorMessage?: string;
  },
): Promise<Resolution> => {
  const {
    interval = 1_000,
    timeout = 30_000,
    nonCompleteErrorMessage = 'Polling completion condition was never achieved',
  } = options ?? {};
  return await new Promise((resolve, reject) => {
    // This timeout safely exits the function if the completion condition
    // isn't achieved within the given timeout
    const timeoutHandle = setTimeout(() => {
      clearInterval(intervalHandle);
      // Rejecting with a string rather than an error so that the failure
      // bubbles up to the test, giving better output
      // eslint-disable-next-line prefer-promise-reject-errors
      reject(nonCompleteErrorMessage);
    }, timeout);
    // using a stack even though we only intend to have one promise at a time
    // because we can synchronously measure the length of an array
    // but we can't synchronously check the status of a promise
    const promiseStack: Array<Promise<Resolution>> = [];
    const intervalHandle = setInterval(() => {
      // don't create new promises if we've still got a promise in flight
      if (promiseStack.length > 0) return;
      // enqueue a new promise
      promiseStack.push(promise());
      Promise.all(promiseStack).then(
        responses => {
          // dequeue the last promise
          void promiseStack.pop();
          responses.forEach(response => {
            const isComplete = completionCondition(response);
            // if one of the responses in the stack is the one we want
            // then clear down and resolve to that response
            if (isComplete) {
              clearInterval(intervalHandle);
              clearTimeout(timeoutHandle);
              resolve(response);
            }
          });
        },
        error => {
          // if the underlying promise rejects then we stop polling,
          // clear down and pass the rejection up
          clearInterval(intervalHandle);
          clearTimeout(timeoutHandle);
          reject(error);
        },
      );
    }, interval);
  });
};

export const getTodayDateTime = (): string => {
  const today = new Date();
  const date = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
  const time = `${today.getHours()}${today.getMinutes()}${today.getSeconds()}`;
  return date + '-' + time;
};

export async function delay(min: number): Promise<unknown> {
  const ms = min * 60 * 1000;
  return await new Promise(resolve => setTimeout(resolve, ms));
}

// ***********************  TodayDate in YYYYMMDD format ***********************
export const TodayDate = (): string => {
  const date = new Date();

  // Get year, month, and day part from the date
  const year = date.toLocaleString('default', { year: 'numeric' });
  const month = date.toLocaleString('default', { month: '2-digit' });
  const day = date.toLocaleString('default', { day: '2-digit' });

  // Generate yyyy-mm-dd date string
  const formattedDate = year + month + day;
  return formattedDate;
};

// ***********************  yesterdayDate in YYYYMMDD format ***********************
export const yesterdayDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  // Get year, month, and day part from the date
  const year = date.toLocaleString('default', { year: 'numeric' });
  const month = date.toLocaleString('default', { month: '2-digit' });
  const day = date.toLocaleString('default', { day: '2-digit' });

  // Generate yyyy-mm-dd date string
  const formattedDate = year + month + day;
  return formattedDate;
};

export const productFamily = (eventName: string): string => {
  let productFamilyName = '';
  if (eventName === 'AUTH_CREATE_ACCOUNT' || eventName === 'AUTH_CHECK_USER_NO_ACCOUNT_WITH_EMAIL') {
    productFamilyName = 'AUTH_ACCOUNT_CREATION';
  }
  if (eventName === 'AUTH_PASSWORD_RESET_SUCCESSFUL') {
    productFamilyName = 'AUTH_ACCOUNT_MANAGEMENT';
  }
  if (eventName === 'AUTH_CODE_VERIFIED') {
    productFamilyName = 'AUTH_ACCOUNT_MFA';
  }
  if (eventName === 'AUTH_LOG_IN_SUCCESS' || eventName === 'AUTH_CHECK_USER_KNOWN_EMAIL') {
    productFamilyName = 'AUTH_ACCOUNT_USER_LOGIN';
  }
  if (eventName === 'AUTH_AUTHORISATION_INITIATED') {
    productFamilyName = 'AUTH_ORCHESTRATION';
  }
  if (
    eventName === 'DCMAW_APP_END' ||
    eventName === 'DCMAW_APP_HANDOFF_START' ||
    eventName === 'DCMAW_DRIVING_LICENCE_SELECTED' ||
    eventName === 'DCMAW_CRI_START' ||
    eventName === 'DCMAW_APP_START' ||
    eventName === 'DCMAW_BRP_SELECTED' ||
    eventName === 'DCMAW_CRI_VC_ISSUED' ||
    eventName === 'DCMAW_PASSPORT_SELECTED' ||
    eventName === 'DCMAW_WEB_END'
  ) {
    productFamilyName = 'DCMAW_CRI';
  }
  if (eventName === 'IPV_ADDRESS_CRI_START' || eventName === 'IPV_ADDRESS_CRI_VC_ISSUED') {
    productFamilyName = 'IPV_CRI_ADDRESS';
  }
  if (eventName === 'IPV_DL_CRI_VC_ISSUED' || eventName === 'IPV_DL_CRI_START') {
    productFamilyName = 'IPV_CRI_DRIVING_LICENSE';
  }
  if (eventName === 'IPV_FRAUD_CRI_START' || eventName === 'IPV_FRAUD_CRI_VC_ISSUED') {
    productFamilyName = 'IPV_CRI_FRAUD';
  }
  if (
    eventName === 'IPV_IDENTITY_REUSE_COMPLETE' ||
    eventName === 'IPV_IDENTITY_REUSE_RESET' ||
    eventName === 'IPV_JOURNEY_END' ||
    eventName === 'IPV_JOURNEY_START' ||
    eventName === 'IPV_SPOT_RESPONSE_APPROVED' ||
    eventName === 'IPV_SPOT_RESPONSE_REJECTED'
  ) {
    productFamilyName = 'IPV_JOURNEY';
  }
  if (eventName === 'IPV_KBV_CRI_START' || eventName === 'IPV_KBV_CRI_VC_ISSUED') {
    productFamilyName = 'IPV_CRI_KBV';
  }
  if (eventName === 'IPV_PASSPORT_CRI_VC_ISSUED' || eventName === 'IPV_PASSPORT_CRI_START') {
    productFamilyName = 'IPV_CRI_PASSPORT';
  }

  return productFamilyName;
};

export const waitForStepFunction = async (executionArn: string, waitTime: number): Promise<unknown> => {
  let StepExecutionStatus = await describeExecution(executionArn);
  let timer = 1;
  while (timer <= waitTime) {
    if (StepExecutionStatus.status !== 'RUNNING') {
      break;
    }
    timer++;
    await delay(1);
    StepExecutionStatus = await describeExecution(executionArn);
  }
  return StepExecutionStatus.status;
};
