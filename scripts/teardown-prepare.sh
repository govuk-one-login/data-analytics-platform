#!/bin/bash -e

# see https://stackoverflow.com/a/246128
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
REGION="eu-west-2"
ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Environment not provided"
  echo "Usage: teardown-prepare.sh ENVIRONMENT"
  exit 1
fi

# validate environment for the benefit of local execution (it will have already been validated if running via the github action)
"$SCRIPT_DIR/validate-environment.sh" "$ENVIRONMENT"

LOWERCASE_ENVIRONMENT=$(echo "$ENVIRONMENT" | tr '[:upper:]' '[:lower:]')
BUCKET_PREFIX="$LOWERCASE_ENVIRONMENT-dap"

# empty s3 buckets as deleting a bucket while deleting stack will fail if the bucket is not empty
for bucket in $(aws --region "$REGION" s3api list-buckets --query 'Buckets[].Name' --output text); do
  if [[ $bucket =~ ^"$BUCKET_PREFIX"-.*$ ]]; then
    echo "Emptying $bucket"
    aws s3 --region "$REGION" rm "s3://$bucket" --quiet --recursive
  fi
done

# delete redshift namespace snapshot as deleting redshift namespace while deleting stack will fail if snapshot of same name already exists
aws --region "$REGION" redshift-serverless list-snapshots --output text --query 'snapshots[*].[snapshotName]' | while read -r name; do
  aws --region "$REGION" redshift-serverless delete-snapshot --snapshot-name "$name" --no-cli-pager
done
