import { analysisIdFromS3Uri, filenameFromAnalysisId } from './filename-utils';

test('filename from analysis id', () => {
  jest.useFakeTimers().setSystemTime(new Date('2024-03-04T12:06:24.000Z'));

  const analysisId = '98957a5f-f68f-4f63-b359-3aa633f8fcbc';
  expect(filenameFromAnalysisId(analysisId)).toEqual(`export-98957a5ff68f4f63b3593aa633f8fcbc-20240304T120624.zip`);

  const invalidId = '123456-hello-7890';
  expect(() => filenameFromAnalysisId(invalidId)).toThrow(`Analysis id must be a valid UUID - received ${invalidId}`);
});

test('analysis id from s3 uri', () => {
  const filename = 'export-98957a5ff68f4f63b3593aa633f8fcbc-20240304T120624.zip';

  const validUri = `s3://my-bucket/${filename}`;
  expect(analysisIdFromS3Uri(validUri)).toEqual('98957a5f-f68f-4f63-b359-3aa633f8fcbc');

  const validUriWithExportInBucketName = `s3://export-bucket/${filename}`;
  expect(analysisIdFromS3Uri(validUriWithExportInBucketName)).toEqual('98957a5f-f68f-4f63-b359-3aa633f8fcbc');

  const invalidUri = 's3://dev-dap-quicksight-exports/test-export.zip';
  expect(() => analysisIdFromS3Uri(invalidUri)).toThrow(
    `Invalid S3 URI (expected format 's3://\${bucketName}/export-\${analysisId}-\${timestamp}.zip') - received ${invalidUri}`,
  );
});
