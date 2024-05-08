import { getLogger } from '../../shared/powertools';
import { sfnClient } from '../../shared/clients';
import { ensureDefined, getEnvironmentVariable } from '../../shared/utils/utils';
import { DescribeExecutionCommand, ListExecutionsCommand } from '@aws-sdk/client-sfn';

const logger = getLogger('lambda/stepfunction-validate-execution');

interface ValidateExecutionEvent {
  currentExecutionArn: string;
  messageGroupId: string;
}

interface ValidateExecutionResponse {
  continue: 'true' | 'false';
}

export const handler = async (event: ValidateExecutionEvent): Promise<ValidateExecutionResponse> => {
  try {
    const stateMachineArn = getEnvironmentVariable('STATE_MACHINE_ARN');
    logger.info('Validating stepfunction execution', { event, stateMachineArn });

    const currentExecutionArns = await getCurrentExecutionArns(event, stateMachineArn);
    const executingWithSameId = await getExecutingWithSameId(event, currentExecutionArns);
    if (executingWithSameId.length > 0) {
      logger.error('One or more other executions found with the same MessageGroupId', { executingWithSameId });
      return { continue: 'false' };
    } else {
      return { continue: 'true' };
    }
  } catch (error) {
    logger.error('Error validating stepfunction execution', { error });
    throw error;
  }
};

const getCurrentExecutionArns = async (event: ValidateExecutionEvent, stateMachineArn: string): Promise<string[]> => {
  const request = new ListExecutionsCommand({ stateMachineArn });
  const executions = await sfnClient.send(request).then(response => response.executions ?? []);
  return executions
    .filter(execution => execution.status === 'RUNNING' || execution.status === 'PENDING_REDRIVE') // only get running or about to run
    .map(execution => ensureDefined(() => execution.executionArn)) // ensure defined
    .filter(executionArn => executionArn !== event.currentExecutionArn); // only get ones that are not the current execution from the lambda event
};

const getExecutingWithSameId = async (event: ValidateExecutionEvent, executionArns: string[]): Promise<string[]> => {
  const executingWithSameId: string[] = [];
  for (const executionArn of executionArns) {
    const executionInput = await getExecutionInput(executionArn);
    const parsedInput = JSON.parse(executionInput);
    if (parsedInput?.at(0)?.attributes?.MessageGroupId === event.messageGroupId) {
      executingWithSameId.push(executionArn);
    }
  }
  return executingWithSameId;
};

const getExecutionInput = async (executionArn: string): Promise<string> => {
  const request = new DescribeExecutionCommand({ executionArn });
  return await sfnClient.send(request).then(response => ensureDefined(() => response.input));
};
