import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  ListExecutionsCommand,
  StopExecutionCommand,
} from '@aws-sdk/client-sfn';

export const executeStepFunction = async (stateMachineArn: string): Promise<string> => {
  const client = new SFNClient({});

  try {
    // Check for and abort any running executions
    await abortRunningExecutions(client, stateMachineArn);

    // Generate unique execution name
    const executionName = `integration-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const startCommand = new StartExecutionCommand({
      stateMachineArn,
      name: executionName,
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
      if (statusResult.error) {
        console.log('Step Function Error:', statusResult.error);
      }
      status = statusResult.status || 'FAILED';
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`State machine execution failed with status: ${status}`);
    }

    return executionArn;
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

  // Wait a moment for aborts to take effect
  await new Promise(resolve => setTimeout(resolve, 2000));
};
