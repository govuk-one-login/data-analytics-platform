#!/bin/bash
# Check last activity of IaC-managed resources via CloudWatch metrics
# Usage: ./scripts/audit-resource-activity.sh [profile] [region] [days-lookback]

set -euo pipefail

PROFILE="${1:-dap-build}"
REGION="${2:-eu-west-2}"
DAYS="${3:-90}"
AWS="aws --profile $PROFILE --region $REGION --output json"

END_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
START_TIME=$(date -u -v-${DAYS}d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "$DAYS days ago" +%Y-%m-%dT%H:%M:%SZ)

echo "=============================================="
echo "AWS Resource Activity Audit"
echo "Profile:  $PROFILE"
echo "Region:   $REGION"
echo "Lookback: $DAYS days ($START_TIME to $END_TIME)"
echo "Date:     $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=============================================="
echo ""

# Helper: get max value of a CloudWatch metric over the period
get_metric_sum() {
  local namespace="$1" metric="$2" dim_name="$3" dim_value="$4"
  $AWS cloudwatch get-metric-statistics \
    --namespace "$namespace" \
    --metric-name "$metric" \
    --dimensions "Name=$dim_name,Value=$dim_value" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period $((DAYS * 86400)) \
    --statistics Sum \
    --query 'Datapoints[0].Sum // `0`' 2>/dev/null || echo "0"
}

# --- Lambda Functions ---
echo "--- Lambda Functions ---"
printf "%-50s %15s %s\n" "FUNCTION" "INVOCATIONS" "LAST MODIFIED"
printf "%-50s %15s %s\n" "--------" "-----------" "-------------"
FUNCTIONS=$($AWS lambda list-functions --query 'Functions[].{Name:FunctionName,LastModified:LastModified}' | jq -c '.[]')
echo "$FUNCTIONS" | while IFS= read -r fn; do
  NAME=$(echo "$fn" | jq -r '.Name')
  MODIFIED=$(echo "$fn" | jq -r '.LastModified' | cut -c1-10)
  INVOCATIONS=$(get_metric_sum "AWS/Lambda" "Invocations" "FunctionName" "$NAME")
  if [ "$INVOCATIONS" = "0" ] || [ "$INVOCATIONS" = "0.0" ]; then
    printf "%-50s %15s %s  ⚠️  INACTIVE\n" "$NAME" "$INVOCATIONS" "$MODIFIED"
  else
    printf "%-50s %15s %s\n" "$NAME" "$INVOCATIONS" "$MODIFIED"
  fi
done

# --- Step Functions ---
echo ""
echo "--- Step Functions ---"
printf "%-60s %15s %s\n" "STATE MACHINE" "EXECUTIONS" "LAST EXECUTION"
printf "%-60s %15s %s\n" "-------------" "----------" "--------------"
STATE_MACHINES=$($AWS stepfunctions list-state-machines --query 'stateMachines[].{Name:name,Arn:stateMachineArn}' | jq -c '.[]')
echo "$STATE_MACHINES" | while IFS= read -r sm; do
  NAME=$(echo "$sm" | jq -r '.Name')
  ARN=$(echo "$sm" | jq -r '.Arn')
  EXECUTIONS=$(get_metric_sum "AWS/States" "ExecutionsStarted" "StateMachineArn" "$ARN")
  LAST_EXEC=$($AWS stepfunctions list-executions --state-machine-arn "$ARN" --max-results 1 --query 'executions[0].startDate' 2>/dev/null | jq -r '. // "never"' | cut -c1-10)
  if [ "$EXECUTIONS" = "0" ] || [ "$EXECUTIONS" = "0.0" ]; then
    printf "%-60s %15s %s  ⚠️  INACTIVE\n" "$NAME" "$EXECUTIONS" "$LAST_EXEC"
  else
    printf "%-60s %15s %s\n" "$NAME" "$EXECUTIONS" "$LAST_EXEC"
  fi
done

# --- SQS Queues ---
echo ""
echo "--- SQS Queues ---"
printf "%-60s %15s\n" "QUEUE" "MSGS SENT"
printf "%-60s %15s\n" "-----" "---------"
QUEUES=$($AWS sqs list-queues --query 'QueueUrls' 2>/dev/null | jq -r '.[]? // empty')
for QUEUE_URL in $QUEUES; do
  QUEUE_NAME=$(basename "$QUEUE_URL")
  MSGS_SENT=$(get_metric_sum "AWS/SQS" "NumberOfMessagesSent" "QueueName" "$QUEUE_NAME")
  if [ "$MSGS_SENT" = "0" ] || [ "$MSGS_SENT" = "0.0" ]; then
    printf "%-60s %15s  ⚠️  INACTIVE\n" "$QUEUE_NAME" "$MSGS_SENT"
  else
    printf "%-60s %15s\n" "$QUEUE_NAME" "$MSGS_SENT"
  fi
done

# --- Glue Jobs ---
echo ""
echo "--- Glue Jobs ---"
printf "%-50s %15s %s\n" "JOB" "RUNS" "LAST RUN"
printf "%-50s %15s %s\n" "---" "----" "--------"
GLUE_JOBS=$($AWS glue get-jobs --query 'Jobs[].Name' | jq -r '.[]')
for JOB in $GLUE_JOBS; do
  RUNS=$($AWS glue get-job-runs --job-name "$JOB" --query 'length(JobRuns)' 2>/dev/null || echo "0")
  LAST_RUN=$($AWS glue get-job-runs --job-name "$JOB" --max-results 1 --query 'JobRuns[0].StartedOn' 2>/dev/null | jq -r '. // "never"' | cut -c1-10)
  if [ "$LAST_RUN" = "never" ] || [ "$LAST_RUN" = "null" ]; then
    printf "%-50s %15s %s  ⚠️  INACTIVE\n" "$JOB" "$RUNS" "never"
  else
    printf "%-50s %15s %s\n" "$JOB" "$RUNS" "$LAST_RUN"
  fi
done

# --- S3 Buckets (check for recent objects) ---
echo ""
echo "--- S3 Buckets (checking for recent activity) ---"
printf "%-50s %15s %s\n" "BUCKET" "OBJECTS" "MOST RECENT OBJECT"
printf "%-50s %15s %s\n" "------" "-------" "------------------"
BUCKETS=$($AWS s3api list-buckets --query 'Buckets[].Name' | jq -r '.[]')
for BUCKET in $BUCKETS; do
  OBJ_COUNT=$($AWS s3api list-objects-v2 --bucket "$BUCKET" --max-keys 1 --query 'KeyCount' 2>/dev/null || echo "error")
  if [ "$OBJ_COUNT" = "error" ]; then
    printf "%-50s %15s %s\n" "$BUCKET" "?" "access denied"
    continue
  fi
  if [ "$OBJ_COUNT" = "0" ] || [ "$OBJ_COUNT" = "null" ]; then
    printf "%-50s %15s %s  ⚠️  EMPTY\n" "$BUCKET" "0" "n/a"
  else
    LATEST=$($AWS s3api list-objects-v2 --bucket "$BUCKET" --query 'sort_by(Contents, &LastModified)[-1].LastModified' --max-keys 1000 2>/dev/null | jq -r '. // "unknown"' | cut -c1-10)
    printf "%-50s %15s %s\n" "$BUCKET" "$OBJ_COUNT+" "$LATEST"
  fi
done

echo ""
echo "=============================================="
echo "Activity audit complete."
echo "⚠️  INACTIVE = zero activity in the last $DAYS days"
echo "=============================================="
