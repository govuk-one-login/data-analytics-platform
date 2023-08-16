import type { DescribeDeliveryStreamOutput } from '@aws-sdk/client-firehose';
import type { TestSupportEvent } from '../../src/handlers/test-support/handler';
import { invokeTestSupportLambda } from './lambda-helpers';

export const describeFirehoseDeliveryStream = async (
  deliveryStreamName: string,
): Promise<DescribeDeliveryStreamOutput> => {
  const event: Omit<TestSupportEvent, 'environment'> = {
    command: 'FIREHOSE_DESCRIBE_STREAM',
    input: {
      DeliveryStreamName: deliveryStreamName,
    },
  };
  return (await invokeTestSupportLambda(event)) as unknown as DescribeDeliveryStreamOutput;
};
