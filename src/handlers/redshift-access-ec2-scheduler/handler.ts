import { getLogger } from '../../shared/powertools';
import { getEnvironmentVariable, getRequiredParams } from '../../shared/utils/utils';
import { ec2Client } from '../../shared/clients';
import type { StartInstancesResult, StopInstancesResult } from '@aws-sdk/client-ec2';
import { StartInstancesCommand, StopInstancesCommand } from '@aws-sdk/client-ec2';

export interface InstanceActionEvent {
  action: 'start' | 'stop';
}

type InstanceActionResponse = StartInstancesResult | StopInstancesResult | undefined;

export const logger = getLogger('lambda/ec2-scheduler');

export const handler = async (event: InstanceActionEvent): Promise<InstanceActionResponse> => {
  try {
    return await ec2Client.send(getRequest(event));
  } catch (e) {
    logger.error(`Error in redshift access ec2 scheduler with input ${JSON.stringify(event)}`, { e });
  }
};

const getRequest = (event: InstanceActionEvent): StartInstancesCommand | StopInstancesCommand => {
  const instanceId = getEnvironmentVariable('INSTANCE_ID');
  const { action } = getRequiredParams(event, 'action');
  if (action !== 'start' && action !== 'stop') {
    throw new Error(`Unknown action ${JSON.stringify(action)}`);
  }

  const input = { InstanceIds: [instanceId] };
  logger.info(`Received request to ${action} redshift access server (${instanceId})`);
  return action === 'start' ? new StartInstancesCommand(input) : new StopInstancesCommand(input);
};
