import { checkStageLayerEventsWithTimestamps } from '../../helpers/utils/poll-for-data';
import {
  validateSingleFactEntry,
  validateNoDuplicateExtensions,
  validateNoDuplicateDimEntries,
} from '../../helpers/aws/redshift/conform-layer-queries';

const getDeduplicationData = () => {
  const eventId = (global as { deduplicationEventId?: string }).deduplicationEventId;
  const timestamps = (global as { deduplicationTimestamps?: string[] }).deduplicationTimestamps;
  return { eventId, timestamps };
};

describe('Stage to Conform Deduplication Tests', () => {
  test(
    'Duplicate events appear in stage layer but only one appears in conform layer',
    async () => {
      // Component Test
      const { eventId, timestamps } = getDeduplicationData();

      if (!eventId || !timestamps) {
        throw new Error('Deduplication data not found in global setup');
      }

      // Verify both duplicate events exist in stage layer
      await checkStageLayerEventsWithTimestamps(eventId);

      // Verify only one event exists in conform layer with earliest timestamp
      await validateSingleFactEntry(eventId, timestamps[0]);

      // Verify no duplicate extensions were created
      await validateNoDuplicateExtensions(eventId);

      // Verify no duplicate dimension table entries were created
      await validateNoDuplicateDimEntries(eventId);
    },
    700 * 1000,
  );
});
