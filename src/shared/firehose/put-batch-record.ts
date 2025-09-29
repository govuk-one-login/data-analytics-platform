import { _Record, PutRecordBatchCommand, PutRecordBatchCommandOutput } from '@aws-sdk/client-firehose';
import { firehoseClient } from '../clients';

export const firehosePutRecordBatch = async (
  streamName: string,
  records: _Record[],
): Promise<PutRecordBatchCommandOutput> => {
  return await firehoseClient.send(
    new PutRecordBatchCommand({
      DeliveryStreamName: streamName,
      Records: records,
    }),
  );
};
