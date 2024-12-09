import { handler, logger } from './handler';
import { mockClient } from 'aws-sdk-client-mock';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { S3Event } from 'aws-lambda';

const mockSnsClient = mockClient(SNSClient);

const loggerInfoSpy = jest.spyOn(logger, 'info');
const loggerErrorSpy = jest.spyOn(logger, 'error');

const event: unknown = {
  Records: [
    {
      eventSource: 'aws:s3',
      awsRegion: 'eu-west-2',
      eventName: 'Replication:OperationFailedReplication',
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'ID found on the bucket notification configuration',
        bucket: {
          name: 'source-bucket',
          ownerIdentity: {
            principalId: 'EXAMPLE',
          },
          arn: 'arn:aws:s3:::source-bucket',
        },
        object: {
          key: 'example.txt',
          size: 1024,
          eTag: '0123456789abcdef0123456789abcdef',
          versionId: '096fKKXTRTtl3on89fVO.nfljtsv6qko',
          sequencer: '1234',
        },
      },
      replicationEventData: {
        replicationRuleId: 'test-rule-id',
        destinationBucket: 'test-destination-bucket',
        s3Operation: 'PUT',
        requestTime: '2023-10-27T10:00:00.000Z',
        failureReason: 'Test failure reason',
      },
    },
  ],
};

describe('send-slack-alerts tests', () => {
  beforeEach(() => {
    loggerInfoSpy.mockReset();
    loggerErrorSpy.mockReset();
    jest.resetAllMocks();
  });

  it('should successfully process and send S3 replication failure event to SNS', async () => {
    await handler(event);

    expect(loggerInfoSpy).toHaveBeenCalledWith('Sns topic arn is', {
      topicArn: 'testArn',
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith('Incoming event', { event });
    expect(loggerInfoSpy).toHaveBeenCalledWith('S3 event records found');
    expect(loggerInfoSpy).toHaveBeenCalledWith('Processing record', {
      record: (event as S3Event).Records[0],
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith('Slack message description', {
      description:
        '*S3 Replication Failure*\nBucket: `source-bucket`\nObject: `example.txt`\nOperation: `PUT`\nError: `Test failure reason`',
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith('Attempting to send');
    expect(loggerInfoSpy).toHaveBeenNthCalledWith(
      7,
      'Successfully sent S3 replication event to SNS',
      expect.anything(),
    );
  });

  it('should skip processing for non-S3 events', async () => {
    const event = {
      source: 'some-other-source',
    };

    await handler(event);

    expect(logger.info).toHaveBeenCalledWith('Sns topic arn is', {
      topicArn: 'testArn',
    });
    expect(logger.info).toHaveBeenCalledWith('Incoming event', { event });
    expect(logger.info).toHaveBeenCalledWith('Received a non-S3 event. Skipping processing.');
  });

  it('should handle errors gracefully and log them', async () => {
    mockSnsClient.on(PublishCommand).rejects(new Error('Simulated SNS error'));

    await expect(handler(event)).rejects.toThrow('Error processing event');
    expect(loggerErrorSpy).toHaveBeenCalledWith('Error processing event', expect.any(Object));
  });
});
