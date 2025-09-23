export const pause = (delayInMs: number): Promise<unknown> => {
  return new Promise(r => setTimeout(r, delayInMs));
};
