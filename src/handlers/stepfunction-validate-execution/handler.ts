import { getLogger } from '../../shared/powertools';
import { sfnClient } from '../../shared/clients';
import { ensureDefined, getEnvironmentVariable } from '../../shared/utils/utils';
import { DescribeExecutionCommand, ListExecutionsCommand } from '@aws-sdk/client-sfn';
import type { DescribeExecutionCommandOutput } from '@aws-sdk/client-sfn';

export const logger = getLogger('lambda/stepfunction-validate-execution');

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

    const allExecutions = await getAllExecutions(stateMachineArn);
    const currentExecution = getCurrentExecution(event, allExecutions);
    const otherExecutions = allExecutions.filter(execution => execution.executionArn !== currentExecution.executionArn);
    if (otherExecutions.length === 0) {
      return { continue: 'true' };
    }

    const otherExecutionsWithSameId = otherExecutions.filter(execution => {
      const input = ensureDefined(() => execution.input);
      const parsedInput = JSON.parse(input);
      return parsedInput?.at(0)?.attributes?.MessageGroupId === event.messageGroupId;
    });
    if (otherExecutionsWithSameId.length === 0) {
      return { continue: 'true' };
    } else {
      const startedBeforeWithSameId = otherExecutionsWithSameId.filter(execution =>
        startedBefore(currentExecution, execution),
      );
      if (startedBeforeWithSameId.length > 0) {
        logger.error('One or more other executions found with the same MessageGroupId that started before this one', {
          startedBeforeWithSameId,
        });
        return { continue: 'false' };
      } else {
        return { continue: 'true' };
      }
    }
  } catch (error) {
    logger.error('Error validating stepfunction execution', { error });
    throw error;
  }
};

const getAllExecutions = async (stateMachineArn: string): Promise<DescribeExecutionCommandOutput[]> => {
  const request = new ListExecutionsCommand({ stateMachineArn });
  const executions = await sfnClient.send(request).then(response => response.executions ?? []);
  return Promise.all(
    executions
      .filter(execution => execution.status === 'RUNNING' || execution.status === 'PENDING_REDRIVE') // only get running or about to run
      .map(execution => ensureDefined(() => execution.executionArn)) // ensure defined
      .map(async executionArn => await sfnClient.send(new DescribeExecutionCommand({ executionArn }))),
  );
};

const getCurrentExecution = (
  event: ValidateExecutionEvent,
  executions: DescribeExecutionCommandOutput[],
): DescribeExecutionCommandOutput => {
  const currentExecution = executions.find(e => e.executionArn === event.currentExecutionArn);
  if (currentExecution === undefined) {
    throw new Error(`Unable to find execution for execution ARN ${event.currentExecutionArn}`);
  }
  return currentExecution;
};

const startedBefore = (e1: DescribeExecutionCommandOutput, e2: DescribeExecutionCommandOutput): boolean => {
  const start1 = ensureDefined(() => e1.startDate).getTime();
  const start2 = ensureDefined(() => e2.startDate).getTime();
  return start1 - start2 > 0;
};
