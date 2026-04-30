import { PutRecordBatchCommand, PutRecordBatchCommandOutput, _Record } from '@aws-sdk/client-firehose';
import { firehoseClient } from '../clients';
import { firehosePutRecordBatch } from './put-batch-record';

vi.mock('../clients');

const mockFirehoseClient = firehoseClient as vi.Mocked<typeof firehoseClient>;

describe('firehosePutRecordBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send PutRecordBatchCommand with correct parameters', async () => {
    // Unit Test
    const mockOutput: PutRecordBatchCommandOutput = {
      FailedPutCount: 0,
      Encrypted: false,
      RequestResponses: [],
      $metadata: {},
    };

    mockFirehoseClient.send.mockResolvedValue(mockOutput as never);

    const streamName = 'test-stream';
    const records: _Record[] = [
      { Data: new Uint8Array(Buffer.from('test-data-1')) },
      { Data: new Uint8Array(Buffer.from('test-data-2')) },
    ];

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
    // Unit Test
    const error = new Error('Firehose error');
    mockFirehoseClient.send.mockRejectedValue(error as never);

    const streamName = 'test-stream';
    const records: _Record[] = [{ Data: new Uint8Array(Buffer.from('test-data')) }];

    await expect(firehosePutRecordBatch(streamName, records)).rejects.toThrow('Firehose error');
  });
});
