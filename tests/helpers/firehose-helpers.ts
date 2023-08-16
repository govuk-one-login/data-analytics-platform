import { DescribeDeliveryStreamOutput } from "@aws-sdk/client-firehose";
import { TestSupportEvent } from "../../src/handlers/test-support/handler";
import { invokeTestSupportLambda } from "./lambda-helpers";


export const describeFirehoseDeliveryStream = async (deilveryStreamName: string): Promise<DescribeDeliveryStreamOutput> => {
    const event: Omit<TestSupportEvent, 'environment'> = {
      command: 'FIREHOSE_DESCRIBE_STREAM',
      input: {
        DeliveryStreamName: deilveryStreamName,
      },
    };
    return await invokeTestSupportLambda(event) as unknown as DescribeDeliveryStreamOutput;
  };