/* eslint-disable no-console */
import { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { gunzip } from 'zlib';
import { promisify } from 'util';
import { getIntegrationTestEnv } from '../../utils/utils';

const gunzipAsync = promisify(gunzip);

// The raw-to-stage unhappy path events deliberately contain this literal token in a
// stringified JSON field (extensions / user / txma) so that the ETL fails to json.loads them.
// It is the reliable fingerprint for identifying these test artifacts in the raw layer.
const MALFORMED_MARKER = 'malformed';

/**
 * Build the list of `year=/month=/day=` partition prefixes for the last `days` days
 * (inclusive of today), in UTC. This must cover at least the raw-to-stage ETL selection
 * window (datecreated >= max_processed_dt - 1 day) so that no orphaned malformed event
 * can survive inside the window the main-suite ETL reads.
 */
const buildRecentPartitionPrefixes = (days: number): string[] => {
  const prefixes: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    prefixes.push(`txma-refactored/year=${year}/month=${month}/day=${day}/`);
  }
  return prefixes;
};

/**
 * Sweep the raw layer for orphaned malformed unhappy-path test events and delete them.
 *
 * The raw-to-stage unhappy path suite writes deliberately malformed-JSON events to the
 * shared raw layer. If a test run is interrupted (timeout, abort, crash) before its
 * per-test cleanup runs, the malformed event is orphaned. Because the main-suite ETL
 * query selects the whole recent partition window, a single orphan poisons every
 * subsequent main-suite run for days.
 *
 * This sweep deterministically removes any such artifact regardless of which run created
 * it, making the suites resilient to failed/aborted cleanups. It only targets individual
 * per-event JSON objects (keyed by event_id, i.e. not the Firehose delivery-stream files)
 * that contain the malformed marker, so it never touches real pipeline data.
 *
 * @param days number of day partitions (including today) to scan. Defaults to 7 to safely
 *             cover the ETL's `datecreated >= max_processed_dt - 1 day` window.
 * @returns the S3 keys that were deleted
 */
export const sweepMalformedRawEvents = async (days = 7): Promise<string[]> => {
  const client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });
  const bucket = getIntegrationTestEnv('RAW_LAYER_BUCKET');
  const deletedKeys: string[] = [];

  try {
    for (const prefix of buildRecentPartitionPrefixes(days)) {
      let continuationToken: string | undefined;

      do {
        const listResponse = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );

        for (const object of listResponse.Contents ?? []) {
          const key = object.Key;
          if (!key || !key.endsWith('.json.gz')) {
            // Skip Firehose delivery-stream files and non per-event objects.
            continue;
          }

          const getResponse = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
          const body = await getResponse.Body?.transformToByteArray();
          if (!body) {
            continue;
          }

          const decompressed = (await gunzipAsync(Buffer.from(body))).toString('utf-8');
          if (decompressed.includes(MALFORMED_MARKER)) {
            await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
            deletedKeys.push(key);
            console.log(`🧹 Swept orphaned malformed raw event: ${key}`);
          }
        }

        continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined;
      } while (continuationToken);
    }
  } finally {
    client.destroy();
  }

  return deletedKeys;
};
