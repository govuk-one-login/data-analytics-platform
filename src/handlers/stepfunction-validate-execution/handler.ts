import { logger, initialiseLogger } from '../../shared/logger';
import { sfnClient } from '../../shared/clients';
import { buildErrorMetadata, ensureDefined, getEnvironmentVariable } from '../../shared/utils/utils';
import { ERROR_CODES } from '../../shared/error-codes';
import { DescribeExecutionCommand, ListExecutionsCommand } from '@aws-sdk/client-sfn';
import type { DescribeExecutionCommandOutput } from '@aws-sdk/client-sfn';
import type { Context } from 'aws-lambda';

export { logger } from '../../shared/logger';

interface ValidateExecutionEvent {
  currentExecutionArn: string;
  messageGroupId: string;
}

interface ValidateExecutionResponse {
  continue: 'true' | 'false';
}

export const handler = async (event: ValidateExecutionEvent, context?: Context): Promise<ValidateExecutionResponse> => {
  if (context !== undefined) {
    initialiseLogger(context);
  }
  const startTime = Date.now();
  const correlationId = event.currentExecutionArn;
  logger.info('Handler started', {
    correlationId,
    messageGroupId: event.messageGroupId,
  });

  try {
    const stateMachineArn = getEnvironmentVariable('STATE_MACHINE_ARN');
    logger.info('Validating stepfunction execution', {
      correlationId,
      messageGroupId: event.messageGroupId,
      stateMachineArn,
    });

    const allExecutions = await getAllExecutions(stateMachineArn);
    const currentExecution = getCurrentExecution(event, allExecutions);
    const otherExecutions = allExecutions.filter(execution => execution.executionArn !== currentExecution.executionArn);
    const result = evaluateExecutions(event, currentExecution, otherExecutions, correlationId);
    logger.info('Handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
      continue: result.continue,
    });
    return result;
  } catch (error) {
    logger.error('Error validating stepfunction execution', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.VALIDATE_EXECUTION_FAILED),
    });
    throw error;
  }
};

const evaluateExecutions = (
  event: ValidateExecutionEvent,
  currentExecution: DescribeExecutionCommandOutput,
  otherExecutions: DescribeExecutionCommandOutput[],
  correlationId: string,
): ValidateExecutionResponse => {
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
      const error = new Error(
        'One or more other executions found with the same MessageGroupId that started before this one',
      );
      error.name = 'DuplicateExecutionError';
      logger.error('One or more other executions found with the same MessageGroupId that started before this one', {
        correlationId,
        startedBeforeWithSameId: startedBeforeWithSameId.map(e => ({
          executionArn: e.executionArn,
          startDate: e.startDate,
        })),
        error: buildErrorMetadata(error, ERROR_CODES.DUPLICATE_EXECUTION_DETECTED),
      });
      return { continue: 'false' };
    } else {
      return { continue: 'true' };
    }
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
