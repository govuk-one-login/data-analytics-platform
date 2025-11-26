import { deleteRawLayerTodaysData } from './helpers/aws/s3/delete-todays-s3-data';

export default async function globalTeardown() {
  // eslint-disable-next-line no-console
  console.log('🧹 Global teardown: cleaning up all test data...');
  await deleteRawLayerTodaysData();

  // Report total time including setup
  const setupTime = (global as { setupDuration?: number }).setupDuration || 0;
  if (setupTime > 0) {
    // eslint-disable-next-line no-console
    console.log(`⏱️  Total time including setup: ${Math.round(setupTime / 1000)}s`);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Global teardown completed');
}
