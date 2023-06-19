#!/bin/bash
for bucket in $(aws s3api list-buckets --query 'Buckets[].Name' --output text); do
  tag1=$(aws s3api get-bucket-tagging --bucket $bucket --query 'TagSet[?Key==`aws:cloudformation:stack-name`].Value' --output text 2>/dev/null)
  tag2=$(aws s3api get-bucket-tagging --bucket $bucket --query 'TagSet[?Key==`BillingEnvironment`].Value' --output text 2>/dev/null)
  if [[ $tag1 =~ ^(dap)$ ]] && [[ $tag2 =~ ^($ENVIRONMENT)$ ]]; then
  echo $bucket
  aws s3api delete-objects --bucket $bucket --delete "$(aws s3api list-object-versions --bucket $bucket --output=json --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"  
  fi
done