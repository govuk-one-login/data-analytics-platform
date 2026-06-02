#!/bin/bash
# Audit AWS account for resources not managed by any CloudFormation stack
# Usage: ./scripts/audit-orphaned-resources.sh [profile] [region] [environment]

set -euo pipefail

PROFILE="${1:-dap-dev}"
REGION="${2:-eu-west-2}"
ENVIRONMENT="${3:-dev}"
AWS="aws --profile $PROFILE --region $REGION --output json"

echo "=============================================="
echo "AWS Orphaned Resource Audit"
echo "Profile:     $PROFILE"
echo "Region:      $REGION"
echo "Environment: $ENVIRONMENT"
echo "Date:        $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=============================================="
echo ""

# --- IaC-defined resource names (with Environment substituted) ---
# These are the expected resources from the SAM templates

IAC_BUCKETS=(
  "${ENVIRONMENT}-dap-raw-layer"
  "${ENVIRONMENT}-dap-stage-layer"
  "${ENVIRONMENT}-dap-athena-workgroup"
  "${ENVIRONMENT}-dap-elt-metadata"
  "${ENVIRONMENT}-dap-step-function-process-results"
  "${ENVIRONMENT}-dap-data-quality-metrics"
  "${ENVIRONMENT}-dap-flyway-files"
  "${ENVIRONMENT}-dap-s3-logs"
  "${ENVIRONMENT}-dap-s3-non-event"
  "${ENVIRONMENT}-dap-vpc-flow-logs"
  "${ENVIRONMENT}-dap-cloud-trail"
  "${ENVIRONMENT}-dap-quicksight-s3-logs"
  "${ENVIRONMENT}-dap-quicksight-exports"
  "${ENVIRONMENT}-dap-analysts-files"
  "${ENVIRONMENT}-dap-glue-job-process-results"
)

IAC_LAMBDAS=(
  "txma-event-consumer"
  "athena-get-config-${ENVIRONMENT}"
  "athena-get-statement-${ENVIRONMENT}"
  "s3-notifications-logger-${ENVIRONMENT}"
  "test-support-${ENVIRONMENT}"
  "run-flyway-command"
  "redshift-create-snapshot"
  "redshift-rotate-secret"
  "${ENVIRONMENT}-dap-redshift-error-notification"
  "redshift-get-metadata-${ENVIRONMENT}"
  "s3-send-metadata-${ENVIRONMENT}"
  "s3-raw-to-staging-${ENVIRONMENT}"
  "dlq-to-eventbridge-${ENVIRONMENT}"
  "stepfunction-validate-execution-${ENVIRONMENT}"
  "cognito-quicksight-access"
  "cognito-post-authentication"
  "quicksight-export"
  "quicksight-import"
)

IAC_QUEUES=(
  "${ENVIRONMENT}-placeholder-txma-event-queue"
  "${ENVIRONMENT}-placeholder-txma-event-dlq"
  "${ENVIRONMENT}-dap-redshift-error-dlq"
  "${ENVIRONMENT}-dap-reference-data-processing.fifo"
  "${ENVIRONMENT}-reference-data-processing-dlq.fifo"
  "${ENVIRONMENT}-reference-data-processing-lambda-dlq"
  "${ENVIRONMENT}-dap-e2e-test-producer-queue"
  "${ENVIRONMENT}-dap-e2e-test-producer-dlq"
)

IAC_STATE_MACHINES=(
  "${ENVIRONMENT}-dap-redshift-processing"
  "${ENVIRONMENT}-dap-consolidated-stage-layer-to-redshift-processing"
  "${ENVIRONMENT}-dap-reference-data-redshift-ingestion"
  "${ENVIRONMENT}-dap-txma-raw-consolidated-schema-to-stage-process"
  "${ENVIRONMENT}-dap-consolidated-conformed-layer-to-adm-processing"
  "${ENVIRONMENT}-dap-consolidated-conformed-layer-to-adm-processing-v3"
)

IAC_GLUE_DBS=(
  "${ENVIRONMENT}-txma-raw"
  "${ENVIRONMENT}-txma-stage"
  "${ENVIRONMENT}-txma-data-quality-metrics"
  "${ENVIRONMENT}-sustainability"
  "dap_txma_reporting_db_refactored"
  "audit_refactored"
  "conformed_refactored"
  "presentation_refactored"
)

IAC_GLUE_JOBS=(
  "${ENVIRONMENT}-dap-data-quality-metrics-generation"
  "${ENVIRONMENT}-dap-data-quality-new-stage-metrics-generation"
  "${ENVIRONMENT}-dap-raw-stage-transform-process"
  "${ENVIRONMENT}-dap-splunk-migration-raw-stage-transform-process"
  "${ENVIRONMENT}-reference-data-redshift-ingestion-job"
)

IAC_GLUE_CRAWLERS=(
  "splunk_migrated_data_fixed_schema"
)

IAC_FIREHOSE=(
  "${ENVIRONMENT}-dap-txma-delivery-stream"
)

IAC_LOG_GROUPS=(
  "/aws/dap-cloud-trail-log-group"
  "/aws/dap-IAM-changes-log-group"
  "/aws/stepfunction/dap-process-raw-layer"
  "/aws/stepfunction/dap-redshift-processing"
  "/aws/stepfunction/dap-consolidated-stage-layer-to-redshift"
  "/aws/stepfunction/dap-consolidated-conformed-layer-to-adm"
  "/aws/stepfunction/dap-consolidated-conformed-layer-to-adm-v3"
  "/aws/stepfunction/dap-reference-data-redshift-ingestion"
  "/aws/events/reference-data-ingestion-pipeline-alert"
  "aws-waf-logs-${ENVIRONMENT}-dap-cloudWatchLog"
  "/aws/apigateway/di-data-dap-endpoint-access-logs"
)

IAC_EVENTBRIDGE_RULES=(
  "${ENVIRONMENT}-dap-s3-notifications-logger-eventbridge-rule"
  "${ENVIRONMENT}-dap-hypercare-eventbridge-rule"
  "${ENVIRONMENT}-dap-redshift-create-snapshot-rule"
  "${ENVIRONMENT}-dap-redshift-error-rule"
)

IAC_SSM_PARAMS=(
  "LogsKmsKeyArn"
  "TxMAEventQueueARN"
  "TxMAKMSKeyARN"
  "/${ENVIRONMENT}/dap/Security/WafArn"
  "/tests/di-data-dap/dapRawLayerBucket"
  "/tests/di-data-dap/dapTXMAConsumerSQSQueueUrl"
  "/tests/di-data-dap/dapAthenaWorkgroup"
  "/tests/di-data-dap/dapAthenaRawLayerDatabase"
  "/tests/di-data-dap/dapAthenaStageLayerDatabase"
  "/tests/di-data-dap/rawToStageStepFunction"
  "/tests/di-data-dap/stageToConformStepFunction"
  "/tests/di-data-dap/glueLogGroup"
  "/tests/di-data-dap/redshiftSecretArn"
  "/tests/di-data-dap/redshiftWorkgroupName"
  "/tests/di-data-dap/dapE2ETestProducerQueueUrl"
  "/tests/di-data-dap/obfuscationHmacSecretArn"
  "DAPE2ETestProducerQueueArn"
  "DAPE2ETestProducerKmsKeyArn"
)

IAC_SECRETS=(
  "${ENVIRONMENT}-SplunkPerformanceIndexSecret"
  "cur-account-ids"
)

IAC_REDSHIFT_WORKGROUPS=(
  "${ENVIRONMENT}-redshift-serverless-workgroup"
)

# Helper: check if a value is in an array
is_in_iac() {
  local needle="$1"
  shift
  for item in "$@"; do
    [[ "$needle" == "$item" ]] && return 0
  done
  return 1
}

# Also match IaC resources by partial/pattern (for CFN-generated suffixes like IAM roles)
IAC_ROLE_PREFIXES=(
  "dap-AthenaGetConfigLambdaRole-"
  "dap-AthenaGetStatementLambdaRole-"
  "dap-CloudTrailCloudWatchLogsRole-"
  "dap-DLQLambdaRole-"
  "dap-EventConsumerLambdaRole-"
  "dap-FlowLogRole-"
  "dap-RedshiftCreateSnapshotLambdaRole-"
  "dap-RedshiftErrorNotificationLambdaRole-"
  "dap-RedshiftGetMetadataLambdaRole-"
  "dap-RedshiftSecretRotationLambdaRole-"
  "dap-ReferenceDataProcessingPipeRole-"
  "dap-RunFlywayCommandLambdaRole-"
  "dap-S3NotificationsLoggerLambdaRole-"
  "dap-S3RawToStagingLambdaRole-"
  "dap-S3SendMetadataLambdaRole-"
  "dap-StepFunctionValidationLambdaRole-"
  "dap-TestSupportLambdaRole-"
  "dap-TxmaRawLayerConsolidatedSchemaProcessingStateMa-"
  "dap-quicksight-access-CognitoPostAuthenticationLamb-"
  "dap-quicksight-access-QuicksightAccessLambdaFunctio-"
  "dap-quicksight-access-QuicksightExportLambdaFunctio-"
  "dap-quicksight-access-QuicksightImportLambdaFunctio-"
  "dap-notifications-chatbot-role"
  "dap-elt-metadata-upload-role"
  "dap-flyway-files-upload-role"
  "data-analytics-adm-redshift-role"
  "data-analytics-quicksight-sync-role"
  "${ENVIRONMENT}-dap-glue-scripts-execution-role"
  "${ENVIRONMENT}-dap-hypercare-eventbridge-role"
  "${ENVIRONMENT}-dap-quicksight-lambdas-invoke-role"
  "${ENVIRONMENT}-dap-redshift-migrate-role"
  "${ENVIRONMENT}-dap-redshift-processing-role"
  "${ENVIRONMENT}-dap-statemachine-processing-role"
  "${ENVIRONMENT}-dap-manual-reference-data-upload-role"
  "${ENVIRONMENT}-kinesis-txma-firehose-role"
  "${ENVIRONMENT}-raw-glue-crawler-role"
  "${ENVIRONMENT}-redshift-serverless-role"
  "di-data-dap-notifications-chatbot-role"
  "di-data-dap-slack-di-dap-alerts-chatbot-role"
)

matches_iac_role() {
  local role="$1"
  for prefix in "${IAC_ROLE_PREFIXES[@]}"; do
    [[ "$role" == "$prefix"* ]] && return 0
    [[ "$role" == "$prefix" ]] && return 0
  done
  return 1
}

# Lambda log groups that match IaC lambdas
matches_iac_lambda_log_group() {
  local lg="$1"
  for fn in "${IAC_LAMBDAS[@]}"; do
    [[ "$lg" == "/aws/lambda/$fn" ]] && return 0
  done
  return 1
}

# Resources prefixed with AWSAccelerator are managed by the security team
is_accelerator_managed() {
  [[ "$1" == AWSAccelerator* ]] || [[ "$1" == /accelerator/* ]] || [[ "$1" == */AWSAccelerator* ]] || [[ "$1" == /aws/lambda/AWSAccelerator* ]]
}

echo ">>> Collecting CloudFormation-managed resources..."
STACKS=$($AWS cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE \
  --query 'StackSummaries[].StackName' | jq -r '.[]')

CFN_RESOURCES=$(mktemp)
for STACK in $STACKS; do
  $AWS cloudformation list-stack-resources --stack-name "$STACK" \
    --query 'StackResourceSummaries[].{Type:ResourceType,PhysicalId:PhysicalResourceId,LogicalId:LogicalResourceId,Stack:"""'"$STACK"'"""}' \
    2>/dev/null | jq -c '.[]' >> "$CFN_RESOURCES" || true
done

cfn_has() {
  grep -q "\"PhysicalId\":\"$1\"" "$CFN_RESOURCES" 2>/dev/null
}

cfn_has_partial() {
  grep -q "$1" "$CFN_RESOURCES" 2>/dev/null
}

echo "Found $(wc -l < "$CFN_RESOURCES" | tr -d ' ') resources across $(echo "$STACKS" | wc -l | tr -d ' ') stacks"
echo ""

echo "=============================================="
echo "ORPHANED RESOURCES (not in IaC or any CloudFormation stack)"
echo "=============================================="

# --- S3 Buckets ---
echo ""
echo "--- S3 Buckets ---"
BUCKETS=$($AWS s3api list-buckets --query 'Buckets[].Name' | jq -r '.[]')
for BUCKET in $BUCKETS; do
  if ! is_in_iac "$BUCKET" "${IAC_BUCKETS[@]}" && ! cfn_has "$BUCKET"; then
    echo "  $BUCKET"
  fi
done

# --- Lambda Functions ---
echo ""
echo "--- Lambda Functions ---"
FUNCTIONS=$($AWS lambda list-functions --query 'Functions[].{Name:FunctionName,LastModified:LastModified,Runtime:Runtime}' | jq -c '.[]')
echo "$FUNCTIONS" | while IFS= read -r fn; do
  NAME=$(echo "$fn" | jq -r '.Name')
  if ! is_in_iac "$NAME" "${IAC_LAMBDAS[@]}" && ! is_accelerator_managed "$NAME" && ! cfn_has "$NAME" && ! cfn_has_partial "$NAME"; then
    MODIFIED=$(echo "$fn" | jq -r '.LastModified')
    RUNTIME=$(echo "$fn" | jq -r '.Runtime')
    echo "  $NAME (runtime: $RUNTIME, last modified: $MODIFIED)"
  fi
done

# --- SQS Queues ---
echo ""
echo "--- SQS Queues ---"
QUEUES=$($AWS sqs list-queues --query 'QueueUrls' 2>/dev/null | jq -r '.[]? // empty')
for QUEUE_URL in $QUEUES; do
  QUEUE_NAME=$(basename "$QUEUE_URL")
  if ! is_in_iac "$QUEUE_NAME" "${IAC_QUEUES[@]}" && ! is_accelerator_managed "$QUEUE_NAME" && ! cfn_has "$QUEUE_URL" && ! cfn_has_partial "$QUEUE_NAME"; then
    ATTRS=$($AWS sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names ApproximateNumberOfMessages --query 'Attributes' 2>/dev/null || echo "{}")
    MSGS=$(echo "$ATTRS" | jq -r '.ApproximateNumberOfMessages // "?"')
    echo "  $QUEUE_NAME (messages: $MSGS)"
  fi
done

# --- Step Functions ---
echo ""
echo "--- Step Functions ---"
STATE_MACHINES=$($AWS stepfunctions list-state-machines --query 'stateMachines[].{Name:name,Arn:stateMachineArn}' | jq -c '.[]')
echo "$STATE_MACHINES" | while IFS= read -r sm; do
  NAME=$(echo "$sm" | jq -r '.Name')
  ARN=$(echo "$sm" | jq -r '.Arn')
  if ! is_in_iac "$NAME" "${IAC_STATE_MACHINES[@]}" && ! cfn_has "$ARN" && ! cfn_has_partial "$NAME"; then
    echo "  $NAME"
  fi
done

# --- Glue Databases ---
echo ""
echo "--- Glue Databases ---"
GLUE_DBS=$($AWS glue get-databases --query 'DatabaseList[].Name' | jq -r '.[]')
for DB in $GLUE_DBS; do
  if ! is_in_iac "$DB" "${IAC_GLUE_DBS[@]}" && ! cfn_has "$DB" && ! cfn_has_partial "$DB"; then
    echo "  $DB"
  fi
done

# --- Glue Jobs ---
echo ""
echo "--- Glue Jobs ---"
GLUE_JOBS=$($AWS glue get-jobs --query 'Jobs[].Name' | jq -r '.[]')
for JOB in $GLUE_JOBS; do
  if ! is_in_iac "$JOB" "${IAC_GLUE_JOBS[@]}" && ! cfn_has "$JOB" && ! cfn_has_partial "$JOB"; then
    echo "  $JOB"
  fi
done

# --- Glue Crawlers ---
echo ""
echo "--- Glue Crawlers ---"
CRAWLERS=$($AWS glue get-crawlers --query 'Crawlers[].Name' 2>/dev/null | jq -r '.[]? // empty')
for CRAWLER in $CRAWLERS; do
  if ! is_in_iac "$CRAWLER" "${IAC_GLUE_CRAWLERS[@]}" && ! cfn_has "$CRAWLER" && ! cfn_has_partial "$CRAWLER"; then
    echo "  $CRAWLER"
  fi
done

# --- Redshift Serverless Workgroups ---
echo ""
echo "--- Redshift Serverless ---"
WORKGROUPS=$($AWS redshift-serverless list-workgroups --query 'workgroups[].workgroupName' | jq -r '.[]? // empty')
for WG in $WORKGROUPS; do
  if ! is_in_iac "$WG" "${IAC_REDSHIFT_WORKGROUPS[@]}" && ! cfn_has "$WG" && ! cfn_has_partial "$WG"; then
    echo "  $WG"
  fi
done

# --- CloudWatch Log Groups ---
echo ""
echo "--- CloudWatch Log Groups ---"
LOG_GROUPS=$($AWS logs describe-log-groups --query 'logGroups[].{Name:logGroupName,Stored:storedBytes,Retention:retentionInDays}' | jq -c '.[]')
echo "$LOG_GROUPS" | while IFS= read -r lg; do
  NAME=$(echo "$lg" | jq -r '.Name')
  if ! is_in_iac "$NAME" "${IAC_LOG_GROUPS[@]}" && ! matches_iac_lambda_log_group "$NAME" && ! is_accelerator_managed "$NAME" && ! cfn_has "$NAME" && ! cfn_has_partial "$NAME"; then
    STORED=$(echo "$lg" | jq -r '.Stored // 0')
    RETENTION=$(echo "$lg" | jq -r '.Retention // "never expires"')
    STORED_MB=$(echo "scale=2; $STORED / 1048576" | bc 2>/dev/null || echo "?")
    echo "  $NAME (${STORED_MB}MB, retention: $RETENTION)"
  fi
done

# --- Secrets Manager ---
echo ""
echo "--- Secrets Manager Secrets ---"
SECRETS=$($AWS secretsmanager list-secrets --query 'SecretList[].{Name:Name,ARN:ARN,LastAccessed:LastAccessedDate}' | jq -c '.[]')
echo "$SECRETS" | while IFS= read -r secret; do
  NAME=$(echo "$secret" | jq -r '.Name')
  ARN=$(echo "$secret" | jq -r '.ARN')
  if ! is_in_iac "$NAME" "${IAC_SECRETS[@]}" && ! cfn_has "$ARN" && ! cfn_has "$NAME" && ! cfn_has_partial "$NAME"; then
    LAST=$(echo "$secret" | jq -r '.LastAccessed // "never"')
    echo "  $NAME (last accessed: $LAST)"
  fi
done

# --- SSM Parameters ---
echo ""
echo "--- SSM Parameters ---"
SSM_PARAMS=$($AWS ssm describe-parameters --query 'Parameters[].Name' | jq -r '.[]')
for PARAM in $SSM_PARAMS; do
  if ! is_in_iac "$PARAM" "${IAC_SSM_PARAMS[@]}" && ! is_accelerator_managed "$PARAM" && ! cfn_has "$PARAM" && ! cfn_has_partial "$PARAM"; then
    echo "  $PARAM"
  fi
done

# --- IAM Roles (dap/di-data related) ---
echo ""
echo "--- IAM Roles (dap/di-data related) ---"
ROLES=$($AWS iam list-roles --query 'Roles[?contains(RoleName,`dap`) || contains(RoleName,`di-data`)].{Name:RoleName,Created:CreateDate}' | jq -c '.[]')
echo "$ROLES" | while IFS= read -r role; do
  [ -z "$role" ] && continue
  NAME=$(echo "$role" | jq -r '.Name')
  if ! matches_iac_role "$NAME" && ! cfn_has "$NAME" && ! cfn_has_partial "$NAME"; then
    CREATED=$(echo "$role" | jq -r '.Created')
    echo "  $NAME (created: $CREATED)"
  fi
done

# --- VPC Endpoints ---
echo ""
echo "--- VPC Endpoints ---"
ENDPOINTS=$($AWS ec2 describe-vpc-endpoints --query 'VpcEndpoints[].{Id:VpcEndpointId,Service:ServiceName,State:State}' | jq -c '.[]')
echo "$ENDPOINTS" | while IFS= read -r ep; do
  ID=$(echo "$ep" | jq -r '.Id')
  if ! cfn_has "$ID" && ! cfn_has_partial "$ID"; then
    SERVICE=$(echo "$ep" | jq -r '.Service')
    STATE=$(echo "$ep" | jq -r '.State')
    echo "  $ID ($SERVICE, state: $STATE)"
  fi
done

# --- Kinesis Firehose ---
echo ""
echo "--- Kinesis Firehose Delivery Streams ---"
STREAMS=$($AWS firehose list-delivery-streams --query 'DeliveryStreamNames' | jq -r '.[]? // empty')
for STREAM in $STREAMS; do
  if ! is_in_iac "$STREAM" "${IAC_FIREHOSE[@]}" && ! cfn_has "$STREAM" && ! cfn_has_partial "$STREAM"; then
    echo "  $STREAM"
  fi
done

# --- EventBridge Rules ---
echo ""
echo "--- EventBridge Rules (default bus) ---"
RULES=$($AWS events list-rules --query 'Rules[].Name' | jq -r '.[]? // empty')
for RULE in $RULES; do
  if ! is_in_iac "$RULE" "${IAC_EVENTBRIDGE_RULES[@]}" && ! is_accelerator_managed "$RULE" && ! cfn_has "$RULE" && ! cfn_has_partial "$RULE"; then
    echo "  $RULE"
  fi
done

# --- CloudFormation stacks in bad state ---
echo ""
echo "--- CloudFormation Stacks (failed/rollback states) ---"
BAD_STACKS=$($AWS cloudformation list-stacks \
  --stack-status-filter DELETE_FAILED ROLLBACK_COMPLETE ROLLBACK_FAILED UPDATE_ROLLBACK_FAILED CREATE_FAILED \
  --query 'StackSummaries[].{Name:StackName,Status:StackStatus}' | jq -c '.[]? // empty')
echo "$BAD_STACKS" | while IFS= read -r stack; do
  [ -z "$stack" ] && continue
  NAME=$(echo "$stack" | jq -r '.Name')
  STATUS=$(echo "$stack" | jq -r '.Status')
  echo "  BAD STATE: $NAME ($STATUS)"
done

# Cleanup
rm -f "$CFN_RESOURCES"

echo ""
echo "=============================================="
echo "Audit complete."
echo "=============================================="
