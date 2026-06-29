#!/usr/bin/env bash
# Delete AWS resources that were skipped during CloudFormation rollback cleanup.
# These exist in AWS but not in the stack, causing "already exists" errors on deploy.
#
# Usage: ./scripts/recovery/dev/cleanup-orphaned-resources.sh <stack-name> [--dry-run]

set -euo pipefail

REGION="${AWS_REGION:-eu-west-2}"
STACK_NAME="${1:-dap}"
DRY_RUN="${2:-}"

if [[ "$STACK_NAME" == "--help" ]]; then
  echo "Usage: $0 <stack-name> [--dry-run]"
  exit 0
fi

echo "----| Finding orphaned resources (skipped during rollback) for stack: $STACK_NAME"
echo ""

# Get resources that were DELETE_SKIPPED
SKIPPED=$(aws cloudformation describe-stack-events \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "StackEvents[?ResourceStatus=='DELETE_SKIPPED'].LogicalResourceId" \
  --output text 2> /dev/null | tr '\t' '\n' | sort -u)

if [[ -z "$SKIPPED" ]]; then
  echo "----| No skipped resources found."
  exit 0
fi

# Find which ones are NOT in the stack (truly orphaned)
ORPHANED=()
for lid in $SKIPPED; do
  in_stack=$(aws cloudformation describe-stack-resource \
    --stack-name "$STACK_NAME" \
    --logical-resource-id "$lid" \
    --region "$REGION" 2>&1 || true)
  if echo "$in_stack" | grep -q "does not exist"; then
    ORPHANED+=("$lid")
  fi
done

if [[ ${#ORPHANED[@]} -eq 0 ]]; then
  echo "----| All skipped resources are back in the stack. Nothing to clean up."
  exit 0
fi

echo "----| Orphaned resources (${#ORPHANED[@]}):"

# Look up physical IDs from the deleted stack
DELETED_STACK_ARN=$(aws cloudformation list-stacks \
  --stack-status-filter DELETE_COMPLETE \
  --region "$REGION" \
  --query "StackSummaries[?StackName=='$STACK_NAME'].StackId | sort(@) | [0]" \
  --output text 2> /dev/null)

for lid in "${ORPHANED[@]}"; do
  # Try to get resource info from deleted stack
  RESOURCE_INFO=$(aws cloudformation list-stack-resources \
    --stack-name "$DELETED_STACK_ARN" \
    --region "$REGION" \
    --query "StackResourceSummaries[?LogicalResourceId=='$lid'].{Type:ResourceType,PhysicalId:PhysicalResourceId}" \
    --output json 2> /dev/null | python3 -c "import json,sys;r=json.load(sys.stdin);print(f\"{r[0]['Type']}|{r[0]['PhysicalId']}\" if r else '')" 2> /dev/null || echo "")

  if [[ -z "$RESOURCE_INFO" ]]; then
    echo "----|  $lid — could not find resource info, skip manually"
    continue
  fi

  RTYPE="${RESOURCE_INFO%%|*}"
  PHYSICAL_ID="${RESOURCE_INFO##*|}"
  echo "----|  $lid ($RTYPE) -> $PHYSICAL_ID"

  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    continue
  fi

  case "$RTYPE" in
    AWS::S3::BucketPolicy)
      echo "----|    Deleting bucket policy on: $PHYSICAL_ID"
      aws s3api delete-bucket-policy --bucket "$PHYSICAL_ID" --region "$REGION" 2> /dev/null || true
      ;;
    AWS::IAM::Role)
      echo "----|    Deleting IAM role: $PHYSICAL_ID"
      # Detach managed policies
      for arn in $(aws iam list-attached-role-policies --role-name "$PHYSICAL_ID" --query "AttachedPolicies[].PolicyArn" --output text 2> /dev/null); do
        aws iam detach-role-policy --role-name "$PHYSICAL_ID" --policy-arn "$arn" 2> /dev/null || true
      done
      # Delete inline policies
      for name in $(aws iam list-role-policies --role-name "$PHYSICAL_ID" --query "PolicyNames[]" --output text 2> /dev/null); do
        aws iam delete-role-policy --role-name "$PHYSICAL_ID" --policy-name "$name" 2> /dev/null || true
      done
      # Delete instance profiles
      for ip in $(aws iam list-instance-profiles-for-role --role-name "$PHYSICAL_ID" --query "InstanceProfiles[].InstanceProfileName" --output text 2> /dev/null); do
        aws iam remove-role-from-instance-profile --role-name "$PHYSICAL_ID" --instance-profile-name "$ip" 2> /dev/null || true
      done
      aws iam delete-role --role-name "$PHYSICAL_ID" 2> /dev/null || true
      ;;
    AWS::Events::Rule)
      RULE_NAME="${PHYSICAL_ID##*/}"
      echo "----|    Deleting EventBridge rule: $RULE_NAME"
      TARGETS=$(aws events list-targets-by-rule --rule "$RULE_NAME" --region "$REGION" --query "Targets[].Id" --output text 2> /dev/null)
      if [[ -n "$TARGETS" ]]; then
        aws events remove-targets --rule "$RULE_NAME" --ids $TARGETS --region "$REGION" --force 2> /dev/null || true
      fi
      aws events delete-rule --name "$RULE_NAME" --region "$REGION" --force 2> /dev/null || true
      ;;
    AWS::CloudTrail::Trail)
      echo "----|    Deleting CloudTrail: $PHYSICAL_ID"
      aws cloudtrail delete-trail --name "$PHYSICAL_ID" --region "$REGION" 2> /dev/null || true
      ;;
    AWS::Glue::Job)
      echo "----|    Deleting Glue job: $PHYSICAL_ID"
      aws glue delete-job --job-name "$PHYSICAL_ID" --region "$REGION" 2> /dev/null || true
      ;;
    AWS::Glue::Connection)
      echo "----|    Deleting Glue connection: $PHYSICAL_ID"
      aws glue delete-connection --connection-name "$PHYSICAL_ID" --region "$REGION" 2> /dev/null || true
      ;;
    AWS::Glue::Crawler)
      echo "----|    Deleting Glue crawler: $PHYSICAL_ID"
      aws glue delete-crawler --name "$PHYSICAL_ID" --region "$REGION" 2> /dev/null || true
      ;;
    AWS::Glue::SecurityConfiguration)
      echo "----|    Deleting Glue security config: $PHYSICAL_ID"
      aws glue delete-security-configuration --name "$PHYSICAL_ID" --region "$REGION" 2> /dev/null || true
      ;;
    AWS::Glue::Table)
      # Physical ID format: database|table
      DB="${PHYSICAL_ID%%|*}"
      TABLE="${PHYSICAL_ID##*|}"
      echo "----|    Deleting Glue table: $DB/$TABLE"
      aws glue delete-table --database-name "$DB" --name "$TABLE" --region "$REGION" 2> /dev/null || true
      ;;
    *)
      echo "----|    SKIP — unsupported type, delete manually"
      ;;
  esac
done

echo ""
echo "Done."
