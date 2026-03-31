export const generateTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const generateTimestampFormatted = (): string => {
  return new Date().toISOString();
};
