import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn';

export async function executeStepFunction(stateMachineArn: string): Promise<string> {
  const client = new SFNClient({});

  const startCommand = new StartExecutionCommand({
    stateMachineArn,
  });

  const startResult = await client.send(startCommand);
  const executionArn = startResult.executionArn!;

  // Wait for execution to complete
  let status = 'RUNNING';
  while (status === 'RUNNING') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const statusCommand = new DescribeExecutionCommand({ executionArn });
    const statusResult = await client.send(statusCommand);
    status = statusResult.status || 'FAILED';
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`State machine execution failed with status: ${status}`);
  }

  return executionArn;
}
