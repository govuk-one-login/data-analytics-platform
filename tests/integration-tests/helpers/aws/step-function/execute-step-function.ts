/* eslint-disable no-console */
import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  ListExecutionsCommand,
  StopExecutionCommand,
} from '@aws-sdk/client-sfn';

export const executeStepFunction = async (
  stateMachineArn: string,
  input?: object,
  prefix?: string,
): Promise<{ executionArn: string; status: string; error?: string; cause?: string }> => {
  const client = new SFNClient({});

  try {
    // Check for and abort any running executions
    await abortRunningExecutions(client, stateMachineArn);

    // Generate unique execution name
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const executionName = prefix ? `${prefix}-${randomSuffix}` : `integration-test-${randomSuffix}`;

    const startCommand = new StartExecutionCommand({
      stateMachineArn,
      name: executionName,
      input: input ? JSON.stringify(input) : undefined,
    });

    const startResult = await client.send(startCommand);
    const executionArn = startResult.executionArn!;

    // Wait for execution to complete with 10-minute timeout
    let status = 'RUNNING';
    const startTime = Date.now();
    const timeoutMs = 10 * 60 * 1000; // 10 minutes

    while (status === 'RUNNING') {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Step Function execution timed out after 10 minutes. Execution ARN: ${executionArn}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      const statusCommand = new DescribeExecutionCommand({ executionArn });
      const statusResult = await client.send(statusCommand);
      status = statusResult.status || 'FAILED';
    }

    const describeCommand = new DescribeExecutionCommand({ executionArn });
    const details = await client.send(describeCommand);

    if (status !== 'SUCCEEDED') {
      let glueJobId: string | undefined;
      let logGroupName: string | undefined;

      if (details.cause) {
        try {
          const causeObj = JSON.parse(details.cause);
          glueJobId = causeObj.Id;
          logGroupName = causeObj.LogGroupName;
        } catch {
          // Ignore parse errors
        }
      }

      throw new Error(
        JSON.stringify({
          status,
          error: details.error,
          cause: details.cause,
          executionArn,
          glueJobId,
          logGroupName,
        }),
      );
    }

    return {
      executionArn,
      status,
      error: details.error,
      cause: details.cause,
    };
  } finally {
    client.destroy();
  }
};
const abortRunningExecutions = async (client: SFNClient, stateMachineArn: string): Promise<void> => {
  const listCommand = new ListExecutionsCommand({
    stateMachineArn,
    statusFilter: 'RUNNING',
    maxResults: 10,
  });

  const listResult = await client.send(listCommand);
  const runningExecutions = listResult.executions || [];

  if (runningExecutions.length === 0) {
    console.log('✓ No running executions found');
    return;
  }

  console.log(`🛑 Found ${runningExecutions.length} running execution(s), aborting...`);

  for (const execution of runningExecutions) {
    if (execution.executionArn) {
      const stopCommand = new StopExecutionCommand({
        executionArn: execution.executionArn,
        cause: 'Aborted by integration test setup',
      });
      await client.send(stopCommand);
      console.log(`✓ Aborted execution: ${execution.name}`);
    }
  }

  // Wait for aborts to take effect and Glue jobs to fully stop
  await new Promise(resolve => setTimeout(resolve, 10000));
};
