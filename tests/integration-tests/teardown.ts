import { deleteRawLayerTodaysData } from './helpers/aws/s3/delete-todays-s3-data';

export default async function globalTeardown() {
  // eslint-disable-next-line no-console
  console.log('🧹 Global teardown: cleaning up all test data...');
  await deleteRawLayerTodaysData();
  // eslint-disable-next-line no-console
  console.log('✅ Global teardown completed');
}
