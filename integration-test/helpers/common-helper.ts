export const getEventFileKey = (eventName: string, eventId: string) => {
  const today = new Date();
  return `${eventName}/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
};

const formatNumberInTwoDigits = (num: number): string => {
  return ("0" + num).slice(-2)
}

export const getEventFilePrefix = (eventName: string) => {
  const today = new Date();
  console.log(today)
  return `txma/${eventName}/year=${today.getFullYear()}/month=${formatNumberInTwoDigits(today.getMonth() + 1)}/day=${formatNumberInTwoDigits(today.getDate())}`;
};
export const getErrorFilePrefix = () => {
  const today = new Date();
  console.log(today)
  return `kinesis-processing-errors-metadata-extraction-failed/year=${today.getFullYear()}/month=${formatNumberInTwoDigits(today.getMonth() + 1)}/day=${formatNumberInTwoDigits(today.getDate())}`;
};
export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
