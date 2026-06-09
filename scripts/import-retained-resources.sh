#!/usr/bin/env bash
# Import retained resources into a new CloudFormation stack after stack deletion.
#
# Prerequisites:
#   - Authenticated to the target AWS account (aws sso login)
#
# Usage:
#   ./scripts/import-retained-resources.sh <environment> <stack-name>
#
# Example:
#   ./scripts/import-retained-resources.sh dev dap-main-dev

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REGION="${AWS_REGION:-eu-west-2}"
CHANGE_SET_NAME="ImportRetainedResources"

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <environment> <stack-name>"
  echo "  environment: dev | build | staging | integration | production | production-preview"
  echo "  stack-name:  the CloudFormation stack name to import into"
  exit 1
fi

ENVIRONMENT="$1"
STACK_NAME="$2"
OUTPUT_FILE="$PROJECT_ROOT/resources-to-import.json"
TEMPLATE_FILE="$PROJECT_ROOT/template.yaml"

# Validate environment
case "$ENVIRONMENT" in
  dev | build | staging | integration | production | production-preview) ;;
  *)
    echo "Error: Invalid environment '$ENVIRONMENT'"
    exit 1
    ;;
esac

# Get AWS account ID
echo "Getting AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION")
echo "Account ID: $ACCOUNT_ID"

# Build the template
echo "Building template..."
npm run iac:build -- main

# Generate the resources-to-import JSON
echo "Generating resources-to-import.json..."
npx tsx "$SCRIPT_DIR/generate-import-resources.ts" \
  --environment "$ENVIRONMENT" \
  --account-id "$ACCOUNT_ID" \
  --template "$TEMPLATE_FILE" \
  --output "$OUTPUT_FILE" \
  --region "$REGION"

RESOURCE_COUNT=$(python3 -c "import json; print(len(json.load(open('$OUTPUT_FILE'))))")
echo ""
echo "Resources to import: $RESOURCE_COUNT"

# Confirm before proceeding
echo ""
echo "This will create an IMPORT change set on stack '$STACK_NAME' in $ENVIRONMENT ($ACCOUNT_ID)."
read -rp "Continue? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# Create the import change set
echo ""
echo "Creating import change set..."
aws cloudformation create-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "$CHANGE_SET_NAME" \
  --change-set-type IMPORT \
  --template-body "file://$TEMPLATE_FILE" \
  --resources-to-import "file://$OUTPUT_FILE" \
  --parameters "ParameterKey=Environment,ParameterValue=$ENVIRONMENT" \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region "$REGION"

# Wait for change set to be created
echo "Waiting for change set to be ready..."
aws cloudformation wait change-set-create-complete \
  --stack-name "$STACK_NAME" \
  --change-set-name "$CHANGE_SET_NAME" \
  --region "$REGION"

# Show change set details
echo ""
echo "Change set created. Reviewing..."
aws cloudformation describe-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "$CHANGE_SET_NAME" \
  --region "$REGION" \
  --query "Changes[].{Action:ResourceChange.Action,LogicalId:ResourceChange.LogicalResourceId,Type:ResourceChange.ResourceType}" \
  --output table

# Confirm execution
echo ""
read -rp "Execute the import change set? (y/N) " execute_confirm
if [[ "$execute_confirm" != "y" && "$execute_confirm" != "Y" ]]; then
  echo "Change set created but not executed. You can execute it manually with:"
  echo "  aws cloudformation execute-change-set --stack-name $STACK_NAME --change-set-name $CHANGE_SET_NAME --region $REGION"
  exit 0
fi

# Execute the change set
echo "Executing import change set..."
aws cloudformation execute-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "$CHANGE_SET_NAME" \
  --region "$REGION"

echo "Import in progress. Monitor with:"
echo "  aws cloudformation describe-stack-events --stack-name $STACK_NAME --region $REGION --query 'StackEvents[0:10]' --output table"
echo ""
echo "Wait for completion with:"
echo "  aws cloudformation wait stack-import-complete --stack-name $STACK_NAME --region $REGION"
