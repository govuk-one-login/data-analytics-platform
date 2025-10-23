import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

export const retrieveSsmParameterValue = async (name: string, region: string) => {
  const client = new SSMClient({
    region: region,
  });
  const command = new GetParameterCommand({ Name: name });

  try {
    const response = await client.send(command);

    if (typeof response.Parameter?.Value === 'string') {
      return response.Parameter?.Value;
    } else {
      throw new Error(`Parameter ${name} has no value`);
    }
  } catch (error) {
    throw new Error(`SSM parameter with name ${name} not found. \n${error}`);
  }
};
