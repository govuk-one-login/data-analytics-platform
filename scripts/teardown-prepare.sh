#!/bin/bash

# empty s3 buckets as deleting a bucket while deleting stack will fail if the bucket is not empty
for bucket in $(aws s3api list-buckets --query 'Buckets[].Name' --output text); do
  tag1=$(aws s3api get-bucket-tagging --bucket "$bucket" --query 'TagSet[?Key==`aws:cloudformation:stack-name`].Value' --output text 2> /dev/null)
  if [[ $tag1 =~ ^(dap)$ ]]; then
    if [ "$(aws s3 ls "$bucket" | wc -l | sed -e 's/[[:space:]]*//g')" != "0" ]; then
      aws s3api delete-objects --bucket "$bucket" --delete "$(aws s3api list-object-versions --bucket "$bucket" --output=json --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"
    fi
  fi
done

# delete redshift namespace snapshot as deleting redshift namespace while deleting stack will fail if snapshot of same name already exists
aws redshift-serverless list-snapshots --output text --query 'snapshots[*].[snapshotName]' | while read -r name; do
  aws redshift-serverless delete-snapshot --snapshot-name "$name" --no-cli-pager
done
