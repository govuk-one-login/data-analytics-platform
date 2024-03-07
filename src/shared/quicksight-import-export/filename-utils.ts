const UUID_REGEX = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

const FLAT_ID_REGEX = '[0-9a-fA-F]{32}';

const TIMESTAMP_REGEX = '\\d{8}T\\d{6}';

export const filenameFromAnalysisId = (analysisId: string): string => {
  if (RegExp(UUID_REGEX).exec(analysisId) === null) {
    throw new Error(`Analysis id must be a valid UUID - received ${analysisId}`);
  }
  const flatId = analysisId.replaceAll('-', '');
  const isoDate = new Date().toISOString();
  const timestamp = isoDate.substring(0, isoDate.lastIndexOf('.')).replaceAll('-', '').replaceAll(':', '');
  return `export-${flatId}-${timestamp}.zip`;
};

export const analysisIdFromS3Uri = (s3Uri: string): string => {
  const matchArray = RegExp(`s3://.+export-(${FLAT_ID_REGEX})-${TIMESTAMP_REGEX}\\.zip`).exec(s3Uri);
  if (matchArray === null) {
    // eslint-disable-next-line no-template-curly-in-string
    const expectedFormat = 's3://${bucketName}/export-${analysisId}-${timestamp}.zip';
    throw new Error(`Invalid S3 URI (expected format '${expectedFormat}') - received ${s3Uri}`);
  }
  const analysisId = matchArray[1];
  return `${analysisId.substring(0, 8)}-${analysisId.substring(8, 12)}-${analysisId.substring(12, 16)}-${analysisId.substring(16, 20)}-${analysisId.substring(20, 32)}`;
};
