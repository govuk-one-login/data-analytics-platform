export const retryOnConcurrentRun = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelayMs: number = 30000,
): Promise<T> => {
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('ConcurrentRunsExceededException') && retries < maxRetries) {
        retries++;
        // eslint-disable-next-line no-console
        console.log(`⏳ Concurrent run detected, waiting ${retryDelayMs / 1000}s (retry ${retries}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
};
