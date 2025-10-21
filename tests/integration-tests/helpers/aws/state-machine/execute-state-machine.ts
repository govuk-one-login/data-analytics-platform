import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn';

export async function executeStepFunction(stateMachineArn: string): Promise<string> {
  const client = new SFNClient({});

  try {
    const startCommand = new StartExecutionCommand({
      stateMachineArn,
    });

    const startResult = await client.send(startCommand);
    const executionArn = startResult.executionArn!;

    // Wait for execution to complete with 10-minute timeout
    let status = 'RUNNING';
    const startTime = Date.now();
    const timeoutMs = 10 * 60 * 1000; // 10 minutes

    while (status === 'RUNNING') {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Step Function execution timed out after 3 minutes. Execution ARN: ${executionArn}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      const statusCommand = new DescribeExecutionCommand({ executionArn });
      const statusResult = await client.send(statusCommand);
      status = statusResult.status || 'FAILED';
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`State machine execution failed with status: ${status}`);
    }

    return executionArn;
  } finally {
    client.destroy();
  }
}
