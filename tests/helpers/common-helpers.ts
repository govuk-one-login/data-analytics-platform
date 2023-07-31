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

export const getTodayDateTime = () : string => {
  var today = new Date();
  var date = today.getFullYear()+''+(today.getMonth()+1)+''+today.getDate();
  var time = today.getHours()+''+today.getMinutes()+''+today.getSeconds();
  var TodaydateTime = date+'-'+time;
  return TodaydateTime
}