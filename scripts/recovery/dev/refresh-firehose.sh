#!/usr/bin/env bash
# Refresh Firehose delivery stream credentials after IAM policy changes.
#
# Firehose caches IAM credentials. After fixing role policies, the stream must be
# updated to force re-assumption of the corrected role.
#
# Usage: ./scripts/recovery/dev/refresh-firehose.sh <environment>

set -euo pipefail

export AWS_PAGER=""

ENVIRONMENT="${1:?Usage: $0 <environment>}"
REGION="${AWS_REGION:-eu-west-2}"
FIREHOSE_NAME="${ENVIRONMENT}-dap-txma-delivery-stream"

echo "====| Refresh Firehose delivery stream credentials |===="

STREAM_INFO=$(aws firehose describe-delivery-stream --delivery-stream-name "$FIREHOSE_NAME" \
  --region "$REGION" 2>/dev/null || echo "")

if [[ -z "$STREAM_INFO" ]]; then
  echo "----|  Firehose stream $FIREHOSE_NAME not found, skipping."
  exit 0
fi

DEST_UPDATE=$(echo "$STREAM_INFO" | python3 -c "
import sys, json

stream = json.load(sys.stdin)['DeliveryStreamDescription']
dest = stream['Destinations'][0]['ExtendedS3DestinationDescription']

update = {
    'RoleARN': dest['RoleARN'],
    'BucketARN': dest['BucketARN'],
    'Prefix': dest.get('Prefix', ''),
    'ErrorOutputPrefix': dest.get('ErrorOutputPrefix', ''),
    'CompressionFormat': dest.get('CompressionFormat', 'GZIP'),
    'BufferingHints': dest.get('BufferingHints', {}),
}

if dest.get('DynamicPartitioningConfiguration', {}).get('Enabled'):
    update['DynamicPartitioningConfiguration'] = dest['DynamicPartitioningConfiguration']

if dest.get('ProcessingConfiguration', {}).get('Enabled'):
    update['ProcessingConfiguration'] = dest['ProcessingConfiguration']

if dest.get('CloudWatchLoggingOptions', {}).get('Enabled'):
    update['CloudWatchLoggingOptions'] = dest['CloudWatchLoggingOptions']

print(json.dumps(update))
")
VERSION_ID=$(echo "$STREAM_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['DeliveryStreamDescription']['VersionId'])")
DEST_ID=$(echo "$STREAM_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['DeliveryStreamDescription']['Destinations'][0]['DestinationId'])")

echo "----|  Updating $FIREHOSE_NAME to refresh role credentials..."
if ! aws firehose update-destination \
  --delivery-stream-name "$FIREHOSE_NAME" \
  --current-delivery-stream-version-id "$VERSION_ID" \
  --destination-id "$DEST_ID" \
  --extended-s3-destination-update "$DEST_UPDATE" \
  --region "$REGION" 2>&1; then
  echo "----|  WARNING: Failed to update Firehose stream."
else
  echo "----|  Done."
fi
