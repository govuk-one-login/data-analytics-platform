import { waitForJob } from './wait-for-job';

class StatusHolder {
  private readonly statuses: string[];

  count: number = 0;
  currentStatus: string = '';

  constructor(statuses: string[]) {
    this.statuses = statuses;
  }

  getStatus(): string | undefined {
    this.currentStatus = this.statuses[this.count++];
    return this.currentStatus;
  }
}

test('wait for job success', async () => {
  const statusHolder = new StatusHolder(['pending', 'pending', 'done']);
  const result = await waitForJob<StatusHolder>({
    statusGetter: async () => statusHolder,
    statusStringGetter: statusHolder => statusHolder.getStatus(),
    successStatuses: ['done'],
    failureStatuses: ['failed'],
    timeoutMs: 100,
    timeoutStepMs: 20,
  });
  expect(result.currentStatus).toEqual('done');
  expect(result.count).toEqual(3);
});

test('wait for job failure', async () => {
  const statusHolder = new StatusHolder(['pending', 'pending', 'failed']);
  const timeoutMs = 100;
  let onErrorExecuted = false;
  await expect(
    waitForJob<StatusHolder>({
      statusGetter: async () => statusHolder,
      statusStringGetter: statusHolder => statusHolder.getStatus(),
      successStatuses: ['done'],
      failureStatuses: ['failed'],
      timeoutMs,
      timeoutStepMs: 20,
      onError: result => {
        expect(result).toBeDefined();
        expect(result?.currentStatus).toEqual('failed');
        expect(result?.count).toEqual(3);
        onErrorExecuted = true;
      },
    }),
  ).rejects.toThrow(`Job did not complete in ${timeoutMs}ms - final status was ${statusHolder.currentStatus}`);
  expect(onErrorExecuted).toEqual(true);
});
