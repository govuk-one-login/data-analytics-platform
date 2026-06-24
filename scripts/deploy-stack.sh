#!/usr/bin/env bash
# deploy-stack.sh — Idempotent two-phase stack deployment.
#
# Handles both fresh deploys and recovery after stack deletion.
# Phase 1: If retained resources exist but stack doesn't, import them.
# Phase 2: Run sam deploy to reconcile full desired state.
#
# Usage: ./scripts/deploy-stack.sh <environment> <application> <stack-name>
#
# Environment variables:
#   AWS_REGION         — AWS region (default: eu-west-2)
#   SKIP_IMPORT        — Set to "true" to skip import phase entirely
#   AUTO_CONFIRM       — Set to "true" to skip confirmation prompts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REGION="${AWS_REGION:-eu-west-2}"
SKIP_IMPORT="${SKIP_IMPORT:-false}"
AUTO_CONFIRM="${AUTO_CONFIRM:-false}"

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <environment> <application> <stack-name>"
  echo "  environment: dev | build | staging | integration | production"
  echo "  application: main | quicksight-access | core"
  echo "  stack-name:  the CloudFormation stack name"
  exit 1
fi

ENVIRONMENT="$1"
APPLICATION="$2"
STACK_NAME="$3"

# Validate inputs
case "$ENVIRONMENT" in
  dev|build|staging|integration|production|production-preview) ;;
  *) echo "Error: Invalid environment '$ENVIRONMENT'"; exit 1 ;;
esac
case "$APPLICATION" in
  main|quicksight-access|core) ;;
  *) echo "Error: Invalid application '$APPLICATION'"; exit 1 ;;
esac

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  deploy-stack.sh                                            ║"
echo "║  Environment: $ENVIRONMENT"
echo "║  Application: $APPLICATION"
echo "║  Stack:       $STACK_NAME"
echo "╚══════════════════════════════════════════════════════════════╝"

# ─── Detect stack state ──────────────────────────────────────────────────────

detect_stack_state() {
  local status
  status=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query "Stacks[0].StackStatus" --output text --region "$REGION" 2>/dev/null) || status="DOES_NOT_EXIST"
  echo "$status"
}

STACK_STATE=$(detect_stack_state)
echo "Stack state: $STACK_STATE"

# ─── Phase 1: Import retained resources if needed ────────────────────────────

needs_import() {
  [[ "$SKIP_IMPORT" == "true" ]] && return 1
  [[ "$STACK_STATE" != "DOES_NOT_EXIST" ]] && return 1

  # Check canary resource — if raw-layer bucket exists, we need import
  local canary_bucket="${ENVIRONMENT}-dap-raw-layer"
  if aws s3api head-bucket --bucket "$canary_bucket" --region "$REGION" 2>/dev/null; then
    return 0
  fi
  return 1
}

if needs_import; then
  echo ""
  echo "═══ Phase 1: Import retained resources ═══"
  echo "Retained resources detected (stack deleted but resources survive)."

  # Build and package
  echo "Building template..."
  npm run build --prefix "$PROJECT_ROOT"
  npm run iac:build --prefix "$PROJECT_ROOT" -- "$APPLICATION"
  (cd "$PROJECT_ROOT" && sam build)

  TEMP_DIR="$PROJECT_ROOT/temp"
  mkdir -p "$TEMP_DIR"
  PACKAGED="$TEMP_DIR/packaged-template.yaml"
  (cd "$PROJECT_ROOT" && sam package --region "$REGION" --resolve-s3 --output-template-file "$PACKAGED")

  # Generate import resources
  RESOURCES_JSON="$TEMP_DIR/resources-to-import.json"
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION")

  echo "Generating import manifest..."
  npx --prefix "$PROJECT_ROOT" tsx "$SCRIPT_DIR/generate-import-resources.ts" \
    --environment "$ENVIRONMENT" --account-id "$ACCOUNT_ID" \
    --template "$PROJECT_ROOT/template.yaml" --output "$RESOURCES_JSON" \
    --region "$REGION" --stack-name "$STACK_NAME"

  IMPORT_TEMPLATE="$TEMP_DIR/import-template.yaml"
  npx --prefix "$PROJECT_ROOT" tsx "$SCRIPT_DIR/generate-import-template.ts" \
    --environment "$ENVIRONMENT" --input "$PACKAGED" \
    --output "$IMPORT_TEMPLATE" --resources-to-import "$RESOURCES_JSON"

  RESOURCE_COUNT=$(python3 -c "import json; print(len(json.load(open('$RESOURCES_JSON'))))")
  echo "Resources to import: $RESOURCE_COUNT"

  if [[ "$RESOURCE_COUNT" -gt 0 ]]; then
    if [[ "$AUTO_CONFIRM" != "true" ]]; then
      read -rp "Proceed with import? (y/N) " confirm
      [[ "$confirm" =~ ^[yY]$ ]] || exit 0
    fi

    # Upload template
    TEMPLATE_BUCKET=$(aws cloudformation describe-stacks \
      --stack-name aws-sam-cli-managed-default --region "$REGION" \
      --query "Stacks[0].Outputs[?OutputKey=='SourceBucket'].OutputValue" --output text 2>/dev/null)
    TEMPLATE_KEY="deploy-stack/$APPLICATION/import-$(date +%s).yaml"
    aws s3 cp "$IMPORT_TEMPLATE" "s3://$TEMPLATE_BUCKET/$TEMPLATE_KEY" --region "$REGION" > /dev/null
    TEMPLATE_URL="https://$TEMPLATE_BUCKET.s3.$REGION.amazonaws.com/$TEMPLATE_KEY"

    # Create and execute import changeset
    echo "Creating IMPORT changeset..."
    aws cloudformation create-change-set \
      --stack-name "$STACK_NAME" \
      --change-set-name "ImportRetainedResources" \
      --change-set-type IMPORT \
      --template-url "$TEMPLATE_URL" \
      --resources-to-import "file://$RESOURCES_JSON" \
      --parameters "ParameterKey=Environment,ParameterValue=$ENVIRONMENT" \
      --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
      --region "$REGION" > /dev/null

    echo "Waiting for changeset to be ready..."
    aws cloudformation wait change-set-create-complete \
      --stack-name "$STACK_NAME" --change-set-name "ImportRetainedResources" --region "$REGION"

    echo "Executing import..."
    aws cloudformation execute-change-set \
      --stack-name "$STACK_NAME" --change-set-name "ImportRetainedResources" --region "$REGION"
    aws cloudformation wait stack-import-complete --stack-name "$STACK_NAME" --region "$REGION"
    echo "Import complete."
  fi

  # Cleanup orphaned resources that block sam deploy
  echo "Cleaning up orphaned resources..."
  aws cloudtrail delete-trail --name UnauthorizedAPICallTrail --region "$REGION" 2>/dev/null || true
  aws cloudtrail delete-trail --name IAMPolicyChangeTrail --region "$REGION" 2>/dev/null || true

  # Remove bucket policies (retained buckets have policies referencing old stack resources)
  for bucket in $(python3 -c "
import json
resources = json.load(open('$RESOURCES_JSON'))
for r in resources:
    if r['ResourceType'] == 'AWS::S3::Bucket':
        print(r['ResourceIdentifier'].get('BucketName',''))
"); do
    aws s3api delete-bucket-policy --bucket "$bucket" --region "$REGION" 2>/dev/null || true
  done

  rm -rf "$TEMP_DIR"
  echo "Phase 1 complete."
  echo ""
else
  if [[ "$STACK_STATE" == "DOES_NOT_EXIST" ]]; then
    echo "Fresh environment — no retained resources found. Skipping import."
  else
    echo "Stack exists ($STACK_STATE) — skipping import."
  fi
fi

# ─── Phase 2: SAM deploy ────────────────────────────────────────────────────

echo ""
echo "═══ Phase 2: SAM deploy ═══"

if [[ "$AUTO_CONFIRM" != "true" && "$STACK_STATE" != "DOES_NOT_EXIST" ]]; then
  read -rp "Run sam deploy? (y/N) " confirm
  [[ "$confirm" =~ ^[yY]$ ]] || exit 0
fi

# Build if not already done in Phase 1
if [[ ! -d "$PROJECT_ROOT/.aws-sam/build" ]]; then
  npm run build --prefix "$PROJECT_ROOT"
  npm run iac:build --prefix "$PROJECT_ROOT" -- "$APPLICATION"
  (cd "$PROJECT_ROOT" && sam build)
fi

(cd "$PROJECT_ROOT" && sam deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --parameter-overrides "Environment=$ENVIRONMENT CodeSigningConfigArn=none PermissionsBoundary=none TestRoleArn=none")

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✓ Deployment complete                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
