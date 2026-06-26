#!/usr/bin/env bash
# Recover a CloudFormation stack after deletion by importing retained resources.
#
# Process:
#   Step 1: Build and package template
#   Step 2: Generate import resources JSON
#   Step 3: Import clean retained resources (new stack)
#   Step 4: Import deferred resources (S3 buckets, then Redshift)
#   Step 5: Cleanup orphaned resources + sam deploy
#   Step 6: Fix IAM role policy drift
#   Step 7: Refresh Firehose delivery stream credentials
#
# Usage: ./scripts/recovery/dev/recover-stack.sh <environment> <application> <stack-name>

set -euo pipefail

export AWS_PAGER=""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
REGION="${AWS_REGION:-eu-west-2}"

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <environment> <application> <stack-name>"
  echo "  environment: dev | build | staging | integration | production | production-preview"
  echo "  application: main | quicksight-access | core"
  echo "  stack-name:  the CloudFormation stack name"
  exit 1
fi

ENVIRONMENT="$1"
APPLICATION="$2"
STACK_NAME="$3"
TEMP_DIR="$PROJECT_ROOT/temp"
mkdir -p "$TEMP_DIR"

TEMPLATE_FILE="$PROJECT_ROOT/template.yaml"
PACKAGED_FILE="$TEMP_DIR/packaged-template.yaml"
IMPORT_TEMPLATE="$TEMP_DIR/import-template.yaml"
CLEAN_JSON="$TEMP_DIR/resources-to-import-clean.json"
FULL_JSON="$TEMP_DIR/resources-to-import.json"
DEFERRED_IDS="$TEMP_DIR/import-template-deferred.json"

case "$ENVIRONMENT" in
  dev | build | staging | integration | production | production-preview) ;;
  *)
    echo "--| Error: Invalid environment '$ENVIRONMENT'"
    exit 1
    ;;
esac
case "$APPLICATION" in
  main | quicksight-access | core) ;;
  *)
    echo "--| Error: Invalid application '$APPLICATION'"
    exit 1
    ;;
esac

# Get AWS info
echo "--| Getting AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION")
echo "--| Account: $ACCOUNT_ID | Environment: $ENVIRONMENT | Stack: $STACK_NAME"

TEMPLATE_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name aws-sam-cli-managed-default --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='SourceBucket'].OutputValue" --output text 2> /dev/null || echo "")
if [[ -z "$TEMPLATE_BUCKET" ]]; then
  echo "--| Error: SAM CLI managed bucket not found. Run 'sam deploy --guided' first."
  exit 1
fi

# Source shared import functions
# shellcheck source=import-resources.sh
source "$SCRIPT_DIR/import-resources.sh"

# =============================================================================
echo ""
echo "====| Step 1: Build and package |===="
"$SCRIPT_DIR/build-and-package.sh" "$APPLICATION"

# =============================================================================
echo ""
echo "====| Step 2: Generate import resources |===="
npx tsx "$SCRIPT_DIR/generate-import-resources.ts" \
  --environment "$ENVIRONMENT" --account-id "$ACCOUNT_ID" \
  --template "$TEMPLATE_FILE" --output "$FULL_JSON" \
  --region "$REGION" --stack-name "$STACK_NAME"

npx tsx "$SCRIPT_DIR/generate-import-template.ts" \
  --environment "$ENVIRONMENT" --input "$PACKAGED_FILE" \
  --output "$IMPORT_TEMPLATE" --resources-to-import "$FULL_JSON"

echo ""
echo "----| Clean resources: $(python3 -c "import json; print(len(json.load(open('$CLEAN_JSON'))))")"
echo "----| Deferred resources: $(python3 -c "import json; print(len(json.load(open('$DEFERRED_IDS'))))")"

# =============================================================================
echo ""
echo "====| Step 3: Import clean retained resources (creates new stack) |===="
read -rp "==--> Continue? (y/N) " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || exit 0

echo ""
echo ""
TEMPLATE_URL=$(upload_template "$IMPORT_TEMPLATE" "step1-clean")
import_resources "$TEMPLATE_URL" "$CLEAN_JSON" "ImportCleanResources"

# =============================================================================
echo ""
echo "====| Step 4: Import deferred resources (S3 buckets, then Redshift) |===="

S3_JSON="$TEMP_DIR/import-s3.json"
REDSHIFT_JSON="$TEMP_DIR/import-redshift.json"
S3_IDS="$TEMP_DIR/ids-clean-s3.json"
REDSHIFT_IDS="$TEMP_DIR/ids-clean-s3-redshift.json"

python3 << PYEOF
import json, subprocess

deferred_ids = set(json.load(open('$DEFERRED_IDS')))
all_resources = json.load(open('$FULL_JSON'))
clean_resources = json.load(open('$CLEAN_JSON'))

s3_resources = []
redshift_resources = []

for r in all_resources:
    if r['LogicalResourceId'] not in deferred_ids:
        continue
    rtype = r['ResourceType']
    ident = r['ResourceIdentifier']
    exists = False
    try:
        if rtype == 'AWS::S3::Bucket':
            result = subprocess.run(['aws', 's3api', 'head-bucket', '--bucket', ident.get('BucketName',''), '--region', '$REGION'], capture_output=True)
            exists = result.returncode == 0
        elif rtype == 'AWS::RedshiftServerless::Namespace':
            result = subprocess.run(['aws', 'redshift-serverless', 'get-namespace', '--namespace-name', ident.get('NamespaceName',''), '--region', '$REGION'], capture_output=True)
            exists = result.returncode == 0
        elif rtype == 'AWS::RedshiftServerless::Workgroup':
            result = subprocess.run(['aws', 'redshift-serverless', 'get-workgroup', '--workgroup-name', ident.get('WorkgroupName',''), '--region', '$REGION'], capture_output=True)
            exists = result.returncode == 0
        elif rtype == 'AWS::IAM::Role':
            result = subprocess.run(['aws', 'iam', 'get-role', '--role-name', ident.get('RoleName','')], capture_output=True)
            exists = result.returncode == 0
        elif rtype == 'AWS::Glue::Job':
            result = subprocess.run(['aws', 'glue', 'get-job', '--job-name', ident.get('Name',''), '--region', '$REGION'], capture_output=True)
            exists = result.returncode == 0
    except:
        pass

    if not exists:
        print(f'  SKIP (gone): {r["LogicalResourceId"]}')
    elif rtype == 'AWS::S3::Bucket':
        s3_resources.append(r)
    elif 'Redshift' in rtype:
        redshift_resources.append(r)
    elif rtype == 'AWS::IAM::Role':
        s3_resources.append(r)
    else:
        print(f'  SKIP (will recreate): {r["LogicalResourceId"]} ({rtype})')

json.dump(s3_resources, open('$S3_JSON', 'w'), indent=2)
json.dump(redshift_resources, open('$REDSHIFT_JSON', 'w'), indent=2)

clean_ids = [r['LogicalResourceId'] for r in clean_resources]
s3_ids = [r['LogicalResourceId'] for r in s3_resources]
redshift_ids = [r['LogicalResourceId'] for r in redshift_resources]
json.dump(clean_ids + s3_ids, open('$S3_IDS', 'w'), indent=2)
json.dump(clean_ids + s3_ids + redshift_ids, open('$REDSHIFT_IDS', 'w'), indent=2)

print(f'  S3 buckets to import: {len(s3_resources)}')
print(f'  Redshift to import: {len(redshift_resources)}')
PYEOF

# Import S3 buckets
S3_COUNT=$(python3 -c "import json; print(len(json.load(open('$S3_JSON'))))")
if [[ "$S3_COUNT" -gt 0 ]]; then
  echo "----|  Importing S3 buckets..."
  generate_import_template "$S3_IDS" "$TEMP_DIR/template-s3.yaml"
  S3_URL=$(upload_template "$TEMP_DIR/template-s3.yaml" "step4-s3")
  import_resources "$S3_URL" "$S3_JSON" "ImportS3Buckets"
fi

# Import Redshift
REDSHIFT_COUNT=$(python3 -c "import json; print(len(json.load(open('$REDSHIFT_JSON'))))")
if [[ "$REDSHIFT_COUNT" -gt 0 ]]; then
  echo "----|  Importing Redshift (with retry for throttling)..."
  generate_import_template "$REDSHIFT_IDS" "$TEMP_DIR/template-redshift.yaml"
  REDSHIFT_URL=$(upload_template "$TEMP_DIR/template-redshift.yaml" "step4-redshift")
  for attempt in 1 2 3; do
    if import_resources "$REDSHIFT_URL" "$REDSHIFT_JSON" "ImportRedshift$attempt"; then
      break
    else
      if [[ "$attempt" -lt 3 ]]; then
        echo "----|  Throttled. Waiting 60s before retry (attempt $attempt/3)..."
        sleep 60
        REDSHIFT_URL=$(upload_template "$TEMP_DIR/template-redshift.yaml" "step4-redshift-retry$attempt")
      else
        echo "----| ERROR: Redshift import failed after 3 attempts."
        echo "----| Stack is in IMPORT_ROLLBACK_COMPLETE. Fix the issue and re-run."
        exit 1
      fi
    fi
  done
fi

# =============================================================================
echo ""
echo "====| Step 5: Cleanup + sam deploy |===="
echo ""
echo "----| Cleaning up orphaned resources..."

# Delete bucket policies from retained buckets
echo "----|  Deleting bucket policies..."
for bucket in $(python3 -c "
import json
resources = json.load(open('$FULL_JSON'))
for r in resources:
    if r['ResourceType'] == 'AWS::S3::Bucket':
        print(r['ResourceIdentifier'].get('BucketName',''))
"); do
  aws s3api delete-bucket-policy --bucket "$bucket" --region "$REGION" 2> /dev/null || true
done

# Delete VPC endpoints in the DAP VPC
VPC_ID=$(aws cloudformation describe-stack-resource --stack-name "$STACK_NAME" \
  --logical-resource-id VPCForDAP --region "$REGION" \
  --query "StackResourceDetail.PhysicalResourceId" --output text 2> /dev/null || echo "")
if [[ -n "$VPC_ID" ]]; then
  echo "----|  Deleting VPC endpoints in $VPC_ID..."
  ENDPOINTS=$(aws ec2 describe-vpc-endpoints --region "$REGION" \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "VpcEndpoints[?Tags[?Key=='aws:cloudformation:stack-name' && Value=='$STACK_NAME']].VpcEndpointId" \
    --output text 2> /dev/null)
  if [[ -n "$ENDPOINTS" && "$ENDPOINTS" != "None" ]]; then
    aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $ENDPOINTS --region "$REGION" 2> /dev/null || true
    echo "----|  Waiting 30s for DNS cleanup..."
    sleep 30
  fi
fi

# Delete CloudTrail trails that were retained
echo "----|  Deleting orphaned CloudTrail trails..."
aws cloudtrail delete-trail --name UnauthorizedAPICallTrail --region "$REGION" 2> /dev/null || true
aws cloudtrail delete-trail --name IAMPolicyChangeTrail --region "$REGION" 2> /dev/null || true

# Run the cleanup script for any other orphaned resources
if [[ -x "$SCRIPT_DIR/cleanup-orphaned-resources.sh" ]]; then
  "$SCRIPT_DIR/cleanup-orphaned-resources.sh" "$STACK_NAME" 2> /dev/null || true
fi

echo ""
read -rp "==--> Run sam deploy? (y/N) " deploy_confirm
[[ "$deploy_confirm" == "y" || "$deploy_confirm" == "Y" ]] || exit 0
echo ""
echo ""

# Pre-apply critical IAM role policies for imported roles
echo "----| Restoring IAM policies on imported roles..."
REDSHIFT_ROLE_NAME="${ENVIRONMENT}-dap-redshift-processing-role"
if aws iam get-role --role-name "$REDSHIFT_ROLE_NAME" --region "$REGION" > /dev/null 2>&1; then
  POLICY_COUNT=$(aws iam list-role-policies --role-name "$REDSHIFT_ROLE_NAME" --query "length(PolicyNames)" --output text 2> /dev/null || echo "0")
  if [[ "$POLICY_COUNT" == "0" ]]; then
    echo "----|  Applying temporary policy to $REDSHIFT_ROLE_NAME..."
    aws iam put-role-policy --role-name "$REDSHIFT_ROLE_NAME" \
      --policy-name dap-statemachine-redshift-processing-policy \
      --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Resource": "arn:aws:events:'"$REGION"':'"$ACCOUNT_ID"':rule/StepFunctionsGetEventsForStepFunctionsExecutionRule*",
            "Action": ["events:PutTargets", "events:PutRule", "events:DescribeRule"]
          },
          {
            "Effect": "Allow",
            "Resource": "*",
            "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:CreateLogDelivery", "logs:GetLogDelivery", "logs:UpdateLogDelivery", "logs:DeleteLogDelivery", "logs:ListLogDeliveries", "logs:PutResourcePolicy", "logs:DescribeResourcePolicies", "logs:DescribeLogGroups"]
          }
        ]
      }'
    echo "----|  Waiting 10s for IAM propagation..."
    sleep 10
  fi
fi

# Check current stack state
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].StackStatus" --output text 2> /dev/null || echo "")
if [[ "$STACK_STATUS" == "UPDATE_ROLLBACK_FAILED" ]]; then
  echo "----|  Stack is in UPDATE_ROLLBACK_FAILED state. Continuing rollback with resource skip..."
  FAILED_RESOURCES=$(aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --region "$REGION" \
    --query "StackEvents[?ResourceStatus=='UPDATE_FAILED'].LogicalResourceId" --output text 2> /dev/null | tr '\t' ' ')
  if [[ -n "$FAILED_RESOURCES" ]]; then
    echo "----|  Skipping failed resources: $FAILED_RESOURCES"
    # shellcheck disable=SC2086
    aws cloudformation continue-update-rollback --stack-name "$STACK_NAME" --region "$REGION" \
      --resources-to-skip $FAILED_RESOURCES
    echo "----|  Waiting for rollback to complete..."
    aws cloudformation wait stack-rollback-complete --stack-name "$STACK_NAME" --region "$REGION"
    echo "----|  Rollback completed. Proceeding with deploy..."
  fi
fi

sam deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --parameter-overrides "Environment=$ENVIRONMENT CodeSigningConfigArn=none PermissionsBoundary=none TestRoleArn=none"

# Handle KMS key rollback issue
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].StackStatus" --output text 2> /dev/null || echo "")
if [[ "$STACK_STATUS" == "UPDATE_ROLLBACK_FAILED" ]]; then
  echo ""
  echo "----|  Deploy failed and rollback stuck. Attempting to continue rollback skipping KMS key..."
  aws cloudformation continue-update-rollback --stack-name "$STACK_NAME" --region "$REGION" \
    --resources-to-skip KmsKey
  aws cloudformation wait stack-rollback-complete --stack-name "$STACK_NAME" --region "$REGION"
  echo "----|  Rollback completed. Retrying deploy..."
  sam deploy \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --resolve-s3 \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --parameter-overrides "Environment=$ENVIRONMENT CodeSigningConfigArn=none PermissionsBoundary=none TestRoleArn=none"
fi

# =============================================================================
echo ""
echo "====| Step 6: Detect and fix IAM role policy drift |===="
"$SCRIPT_DIR/fix-iam-policy-drift.sh" "$STACK_NAME" "$ENVIRONMENT"

# =============================================================================
echo ""
echo "====| Step 7: Refresh Firehose delivery stream credentials |===="
"$SCRIPT_DIR/refresh-firehose.sh" "$ENVIRONMENT"

echo ""
echo "====| Recovery fully complete |===="
