import { handler, logger } from './handler';
import type { InstanceActionEvent } from './handler';
import { EC2Client } from '@aws-sdk/client-ec2';
import { mockClient } from 'aws-sdk-client-mock';

const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

const mockEC2Client = mockClient(EC2Client);

let INSTANCE_ID: string;

beforeEach(() => {
  mockEC2Client.reset();
  loggerInfoSpy.mockReset();
  loggerErrorSpy.mockReset();
  INSTANCE_ID = process.env.INSTANCE_ID = 'i-123abc';
});

test('success', async () => {
  mockEC2Client.resolves({});

  await handler({ action: 'start' });
  await handler({ action: 'stop' });

  expect(mockEC2Client.calls()).toHaveLength(2);
  expect(loggerInfoSpy).toHaveBeenCalledTimes(2);
  expect(loggerInfoSpy).toHaveBeenCalledWith(`Received request to start redshift access server (${INSTANCE_ID})`);
  expect(loggerInfoSpy).toHaveBeenCalledWith(`Received request to stop redshift access server (${INSTANCE_ID})`);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
});

test('invalid events', async () => {
  mockEC2Client.resolves({});

  await handler({ action: 'hahaha' } as unknown as InstanceActionEvent);
  await handler(null as unknown as InstanceActionEvent);
  await handler(undefined as unknown as InstanceActionEvent);

  expect(mockEC2Client.calls()).toHaveLength(0);
  expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(3);
  expect(loggerErrorSpy).toHaveBeenCalledWith(`Error in redshift access ec2 scheduler with input {"action":"hahaha"}`, {
    e: new Error('Unknown action "hahaha"'),
  });
  expect(loggerErrorSpy).toHaveBeenCalledWith(`Error in redshift access ec2 scheduler with input null`, {
    e: new Error('Object is null or undefined'),
  });
  expect(loggerErrorSpy).toHaveBeenCalledWith(`Error in redshift access ec2 scheduler with input undefined`, {
    e: new Error('Object is null or undefined'),
  });
});

test('ec2 error', async () => {
  mockEC2Client.rejects('ec2 error');

  await handler({ action: 'start' });
  await handler({ action: 'stop' });

  expect(mockEC2Client.calls()).toHaveLength(2);
  expect(loggerInfoSpy).toHaveBeenCalledTimes(2);
  expect(loggerInfoSpy).toHaveBeenCalledWith(`Received request to start redshift access server (${INSTANCE_ID})`);
  expect(loggerInfoSpy).toHaveBeenCalledWith(`Received request to stop redshift access server (${INSTANCE_ID})`);
  expect(loggerErrorSpy).toHaveBeenCalledTimes(2);
  expect(loggerErrorSpy).toHaveBeenCalledWith(`Error in redshift access ec2 scheduler with input {"action":"start"}`, {
    e: new Error('ec2 error'),
  });
  expect(loggerErrorSpy).toHaveBeenCalledWith(`Error in redshift access ec2 scheduler with input {"action":"stop"}`, {
    e: new Error('ec2 error'),
  });
});
