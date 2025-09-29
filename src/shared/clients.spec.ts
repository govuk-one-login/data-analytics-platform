describe('clients module', () => {
  test('firehose client retry function is executed during configuration', async () => {
    const { ConfiguredRetryStrategy } = await import('@smithy/util-retry');
    const originalConstructor = ConfiguredRetryStrategy;

    let capturedRetryFunction: ((retryAttempt: number) => number) | undefined;

    // Mock the constructor to capture the retry function
    const MockedStrategy = jest
      .fn()
      .mockImplementation((maxAttempts: number, delayDecider: (retryAttempt: number) => number) => {
        capturedRetryFunction = delayDecider;

        if (delayDecider) {
          delayDecider(1);
          delayDecider(2);
        }

        return new originalConstructor(maxAttempts, delayDecider);
      });

    jest.doMock('@smithy/util-retry', () => ({
      ConfiguredRetryStrategy: MockedStrategy,
    }));

    jest.resetModules();

    const { firehoseClient } = await import('./clients');

    expect(firehoseClient).toBeDefined();
    expect(MockedStrategy).toHaveBeenCalled();
    expect(capturedRetryFunction).toBeDefined();

    expect(capturedRetryFunction!(0)).toBe(1000);
    expect(capturedRetryFunction!(1)).toBe(2000);
    expect(capturedRetryFunction!(2)).toBe(4000);

    jest.unmock('@smithy/util-retry');
  });
});
