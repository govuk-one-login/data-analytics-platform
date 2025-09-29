import { PutRecordBatchCommand, PutRecordBatchCommandOutput, _Record } from '@aws-sdk/client-firehose';
import { firehoseClient } from '../clients';
import { firehosePutRecordBatch } from './put-batch-record';

jest.mock('../clients');

const mockFirehoseClient = firehoseClient as jest.Mocked<typeof firehoseClient>;

describe('firehosePutRecordBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send PutRecordBatchCommand with correct parameters', async () => {
    const mockOutput: PutRecordBatchCommandOutput = {
      FailedPutCount: 0,
      Encrypted: false,
      RequestId: 'test-request-id',
      $metadata: {},
    };

    mockFirehoseClient.send.mockResolvedValue(mockOutput);

    const streamName = 'test-stream';
    const records: _Record[] = [{ Data: Buffer.from('test-data-1') }, { Data: Buffer.from('test-data-2') }];

    const result = await firehosePutRecordBatch(streamName, records);

    expect(mockFirehoseClient.send).toHaveBeenCalledWith(expect.any(PutRecordBatchCommand));
    expect(mockFirehoseClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          DeliveryStreamName: streamName,
          Records: records,
        },
      }),
    );
    expect(result).toEqual(mockOutput);
  });

  it('should throw error when firehose client fails', async () => {
    const error = new Error('Firehose error');
    mockFirehoseClient.send.mockRejectedValue(error);

    const streamName = 'test-stream';
    const records: _Record[] = [{ Data: Buffer.from('test-data') }];

    await expect(firehosePutRecordBatch(streamName, records)).rejects.toThrow('Firehose error');
  });
});
