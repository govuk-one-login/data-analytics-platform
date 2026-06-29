# Stack Recovery Runbook

## Overview

This runbook covers recovering the DAP CloudFormation stack after it has been deleted. Because many resources have `DeletionPolicy: Retain`, they persist in AWS after the stack is removed. The recovery process re-imports these retained resources into a new stack, then runs `sam deploy` to reconcile the full desired state.

**When to use this runbook:**
- The CloudFormation stack has been accidentally or intentionally deleted
- A failed deployment left the stack in `DELETE_COMPLETE` state
- A stack rollback resulted in `ROLLBACK_COMPLETE` and the stack was deleted to retry

**Why this is needed:**
Without an import, redeploying would fail because retained resources (S3 buckets, Redshift, IAM roles, KMS keys) already exist in AWS and CloudFormation defaults to throwing an error when a resource already exists.

## Prerequisites

### AWS access

- AWS SSO credentials for the target environment
- Sufficient permissions to:
  - Create/execute CloudFormation change sets
  - Read/write S3 buckets
  - Modify IAM roles and policies
  - Describe/update Firehose delivery streams
  - Execute Redshift Data API calls
  - Describe VPC endpoints

```sh
export AWS_PROFILE=data-dap-<environment>
aws sso login
```

### Tools required

| Tool | Purpose |
|------|---------|
| AWS SAM CLI (v1.134.0+) | Build and deploy |
| Node.js 22 | Lambda builds and TypeScript scripts |
| Python 3 | Embedded recovery logic |
| AWS CLI v2 | AWS operations |
| Docker | SAM build |

### Repository state

- Working directory is the repository root
- Code is on the branch you wish to deploy (typically `main`)
- No uncommitted changes to IaC files

## Pre-recovery steps

### 1. Confirm the stack is actually gone

```sh
aws cloudformation describe-stacks --stack-name dap --region eu-west-2
```

If this returns a stack in `DELETE_COMPLETE`, `ROLLBACK_COMPLETE`, or errors with "does not exist", proceed.

### 2. Identify retained resources

```sh
./scripts/recovery/dev/list-retained-resources.sh
```

This scans the IaC templates for resources with `DeletionPolicy: Retain` and lists them. Optionally pass `--stack <name>` if the stack still exists (e.g. in a rollback state) to also show physical resource IDs.

### 3. Record key resource identifiers

Note these down — you'll need them if the automated scripts fail:

| Resource | How to find |
|----------|-------------|
| S3 buckets | `aws s3 ls \| grep dap` |
| Redshift namespace | `aws redshift-serverless list-namespaces --region eu-west-2` |
| Redshift workgroup | `aws redshift-serverless list-workgroups --region eu-west-2` |
| KMS key ID | `aws kms list-aliases --region eu-west-2 \| grep dap` |
| VPC ID | `aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*dap*" --region eu-west-2` |

### 4. Confirm SAM CLI managed bucket exists

```sh
aws cloudformation describe-stacks --stack-name aws-sam-cli-managed-default --region eu-west-2
```

If this doesn't exist, run `sam deploy --guided` first to create it.

## Recovery procedure

### Automated recovery (recommended)

The orchestrator script runs all steps end-to-end:

```sh
./scripts/recovery/dev/recover-stack.sh <environment> <application> <stack-name>
```

For the dev environment:
```sh
./scripts/recovery/dev/recover-stack.sh dev main dap
```

The script will pause for confirmation before executing change sets and running `sam deploy`.

### Expected duration

| Step | Duration |
|------|----------|
| Build and package | 2–3 minutes |
| Generate import resources | 30 seconds |
| Import clean resources | 3–5 minutes |
| Import deferred resources (S3 + Redshift) | 5–10 minutes |
| Cleanup + sam deploy | 5–10 minutes |
| Fix IAM policy drift | 30 seconds |
| Refresh Firehose credentials | 10 seconds |
| **Total** | **~20–30 minutes** |

### Step-by-step breakdown

#### Step 1: Build and package

Builds lambdas, IaC templates, and packages the SAM application.

```sh
./scripts/recovery/dev/build-and-package.sh main
```

**Verify:** `temp/packaged-template.yaml` exists.

#### Step 2: Generate import resources

Parses the template and generates JSON files listing resources to import, split into "clean" (no cross-resource dependencies) and "deferred" (S3 buckets and Redshift that reference other resources).

```sh
npx tsx scripts/recovery/dev/generate-import-resources.ts \
  --environment dev --account-id <ACCOUNT_ID> \
  --template template.yaml --output temp/resources-to-import.json \
  --region eu-west-2 --stack-name dap
```

**Verify:** `temp/resources-to-import.json` and `temp/resources-to-import-clean.json` exist and contain resources.

#### Step 3: Import clean retained resources

Creates a new stack by importing resources that have no cross-resource references (IAM roles, KMS keys, VPC, subnets, etc.).

**Verify:** Stack status is `IMPORT_COMPLETE`:
```sh
aws cloudformation describe-stacks --stack-name dap --region eu-west-2 --query "Stacks[0].StackStatus"
```

#### Step 4: Import deferred resources

Imports S3 buckets first, then Redshift (separately to avoid API throttling). Redshift imports retry up to 3 times with 60-second intervals.

**Verify:** Stack still in a healthy state after each import.

#### Step 5: Cleanup + sam deploy

- Deletes bucket policies on retained S3 buckets (CloudFormation will recreate them)
- Deletes orphaned VPC endpoints
- Deletes orphaned CloudTrail trails
- Runs `sam deploy` to reconcile the full template

**Verify:** Stack status is `UPDATE_COMPLETE`:
```sh
aws cloudformation describe-stacks --stack-name dap --region eu-west-2 --query "Stacks[0].StackStatus"
```

#### Step 6: Fix IAM role policy drift

CloudFormation import does not restore inline policies on retained IAM roles. This step detects missing policies by name and applies them from the deployed template.

```sh
./scripts/recovery/dev/fix-iam-policy-drift.sh dap dev
```

**Verify:** Output shows either "All retained IAM roles have correct policies" or lists policies that were applied.

#### Step 7: Refresh Firehose credentials

Firehose caches IAM credentials. After fixing role policies, the delivery stream must be updated to force re-assumption of the corrected role.

```sh
./scripts/recovery/dev/refresh-firehose.sh dev
```

**Verify:** Check Firehose logs stop showing `S3.AccessDenied` errors:
```sh
aws logs get-log-events --log-group-name dev-dap-txma-delivery-stream \
  --log-stream-name dev-dap-txma-delivery-stream --limit 3 \
  --region eu-west-2
```

### Handling partial failures

#### Import changeset fails

If a changeset fails (resource already in another stack, or resource doesn't exist):

1. Check the failure reason:
   ```sh
   aws cloudformation describe-change-set --stack-name dap \
     --change-set-name <changeset-name> --region eu-west-2 \
     --query "StatusReason"
   ```

2. If a resource no longer exists, remove it from the import JSON file and retry.

3. If a resource is in another stack, it must be removed from that stack first.

#### sam deploy fails with UPDATE_ROLLBACK_FAILED

The script automatically detects this and attempts to continue the rollback, skipping failed resources. If it can't recover automatically:

```sh
aws cloudformation continue-update-rollback --stack-name dap --region eu-west-2 \
  --resources-to-skip <LogicalResourceId1> <LogicalResourceId2>
```

Then retry `sam deploy`.

#### Redshift import throttled

The script retries 3 times with 60-second intervals. If all attempts fail, skip the import and run `sam deploy` — CloudFormation will attempt to create the Redshift resources and may need the existing ones deleted first (data loss risk — coordinate with the team).

## Post-recovery validation

### Infrastructure checklist

- [ ] Stack status is `UPDATE_COMPLETE`
- [ ] All SSM parameters exist under `/tests/dap/`
- [ ] SQS queue exists and has an event source mapping to the Lambda
- [ ] Lambda `txma-event-consumer` is in `Active` state
- [ ] Firehose delivery stream is `ACTIVE` and delivering to S3 (no errors in CloudWatch)
- [ ] Redshift workgroup is `AVAILABLE`
- [ ] VPC endpoints are all in `available` state
- [ ] KMS key is `Enabled`

### Data pipeline validation

```sh
# Send a test event and verify it flows through
npm run test:integration
```

The integration tests validate the full pipeline:
1. Events sent to SQS → consumed by Lambda → delivered via Firehose to S3 (raw layer)
2. Raw-to-stage Step Function executes successfully
3. Stage-to-conform (Redshift) Step Function executes successfully

**Expected duration:** ~14 minutes for the full integration test suite.

### Quick smoke test (without full integration tests)

```sh
# Check Firehose is delivering (no S3.AccessDenied)
aws logs get-log-events --log-group-name dev-dap-txma-delivery-stream \
  --log-stream-name dev-dap-txma-delivery-stream --limit 5 --region eu-west-2

# Check SQS queue is empty (Lambda is consuming)
aws sqs get-queue-attributes \
  --queue-url https://sqs.eu-west-2.amazonaws.com/<ACCOUNT_ID>/dev-placeholder-txma-event-queue \
  --attribute-names ApproximateNumberOfMessages --region eu-west-2

# Check DLQ is empty
aws sqs get-queue-attributes \
  --queue-url https://sqs.eu-west-2.amazonaws.com/<ACCOUNT_ID>/dev-placeholder-txma-event-dlq \
  --attribute-names ApproximateNumberOfMessages --region eu-west-2

# Check Redshift can access Glue catalog
aws redshift-data execute-statement \
  --workgroup-name dev-redshift-serverless-workgroup \
  --database dap_txma_reporting_db_refactored \
  --sql "SELECT schemaname, tablename FROM svv_external_tables LIMIT 1" \
  --region eu-west-2
```

## Manual steps

These cannot be automated by the recovery scripts and must be handled separately if missing:

### SSM parameters for higher environments

Higher environments (staging, integration, production) require these SSM parameters to be present in the target account. They reference external TxMA queues and are not in our IaC:

| Parameter | Description |
|-----------|-------------|
| `TxMAEventQueueARN` | ARN of the TxMA event queue from event-processing |
| `TxMAKMSKeyARN` | ARN of the TxMA KMS key for message decryption |

Values can be found on the [DAP TxMA Events Subscription page](https://govukverify.atlassian.net/wiki/spaces/DAP/pages/3591471337/DAP+-+TxMA+Events+Subscription#TxMA-SQS-Queue-Details).

### Redshift stored procedures and schemas

The Redshift database schemas and stored procedures are managed by Flyway migrations, not CloudFormation. If the Redshift namespace was recreated (not retained), you must re-run Flyway:

```sh
# Upload flyway files then run migrations
# See: redshift-scripts/flyway/README.md
```

### QuickSight configuration

QuickSight dashboards, datasets, and user access are not in the IaC. If QuickSight resources were affected:
1. Re-import from the asset bundle in S3 (use the `quicksight-import.yml` workflow)
2. Re-configure SSO IDP URL in QuickSight admin settings

### Cognito users

Cognito user pool users are not recoverable from IaC. If the user pool was recreated, users must be re-invited.

## Known issues and workarounds

### IAM policy drift — policies referencing other resources

**Symptom:** Firehose gets `S3.AccessDenied`, or Redshift gets `glue:GetTable AccessDeniedException`.

**Cause:** The `fix-iam-policy-drift.sh` script resolves `${LogicalResourceId}` references in `Fn::Sub` strings to physical resource names. If a resource uses `!GetAtt` for an ARN (e.g. KMS key), the script falls back to a placeholder. For KMS keys specifically, the key ID can be found via:

```sh
aws cloudformation describe-stack-resource --stack-name dap \
  --logical-resource-id KmsKey --region eu-west-2 \
  --query "StackResourceDetail.PhysicalResourceId"
```

**Workaround:** Manually apply the policy with the correct ARN:
```sh
aws iam put-role-policy --role-name <role-name> \
  --policy-name <policy-name> \
  --policy-document file://correct-policy.json
```

### Firehose continues failing after IAM fix

**Symptom:** `S3.AccessDenied` errors continue in Firehose logs even after the IAM policy is corrected.

**Cause:** Firehose caches IAM credentials for up to 45 minutes.

**Workaround:** Run `./scripts/recovery/dev/refresh-firehose.sh <environment>` or wait up to 45 minutes.

### Redshift import throttling

**Symptom:** `ThrottlingException` during the Redshift import changeset.

**Cause:** Redshift Serverless API rate limits during resource import.

**Workaround:** The script retries 3 times with 60-second delays. If it still fails, wait 5 minutes and re-run just the Redshift import step manually.

### KMS key in PENDING_DELETION state

**Symptom:** Import fails because the KMS key is scheduled for deletion.

**Cause:** Stack deletion scheduled the key for deletion (even with `DeletionPolicy: Retain`, some edge cases can trigger this).

**Workaround:** Cancel the key deletion:
```sh
aws kms cancel-key-deletion --key-id <key-id> --region eu-west-2
aws kms enable-key --key-id <key-id> --region eu-west-2
```

### VPC endpoint conflicts

**Symptom:** `sam deploy` fails with "VPC endpoint already exists" errors.

**Cause:** Retained VPC endpoints weren't cleaned up before deploy.

**Workaround:** The `recover-stack.sh` script deletes these automatically in Step 5. If running manually:
```sh
aws ec2 describe-vpc-endpoints --region eu-west-2 \
  --filters "Name=vpc-id,Values=<vpc-id>" \
  --query "VpcEndpoints[].VpcEndpointId" --output text | \
  xargs aws ec2 delete-vpc-endpoints --vpc-endpoint-ids --region eu-west-2
```

## Rollback

### If import fails partway through

The stack will be in `IMPORT_ROLLBACK_COMPLETE` state. This means it exists but only contains the resources successfully imported before the failure.

**Options:**
1. **Fix and retry** — Remove the problematic resource from the import JSON and create a new changeset for remaining resources
2. **Delete and start over** — Delete the partially-imported stack and re-run from Step 3:
   ```sh
   aws cloudformation delete-stack --stack-name dap --region eu-west-2
   aws cloudformation wait stack-delete-complete --stack-name dap --region eu-west-2
   ```
   This is safe because all resources have `DeletionPolicy: Retain` — nothing will actually be destroyed.

### If sam deploy fails

The stack may be in `UPDATE_ROLLBACK_COMPLETE` or `UPDATE_ROLLBACK_FAILED`:

- **UPDATE_ROLLBACK_COMPLETE** — Safe state. Investigate the error in CloudFormation events, fix the issue, and re-run `sam deploy`.
- **UPDATE_ROLLBACK_FAILED** — Continue the rollback skipping problematic resources:
  ```sh
  aws cloudformation continue-update-rollback --stack-name dap --region eu-west-2 \
    --resources-to-skip <resource1> <resource2>
  ```

### Nuclear option — full delete and reimport

If the stack is in an unrecoverable state:
1. Delete the stack (retained resources survive)
2. Re-run the full `recover-stack.sh` from scratch
3. Re-run Flyway migrations for Redshift if needed

This is always safe for retained resources but will recreate non-retained resources (Lambdas, Step Functions, SSM parameters, etc.) from scratch.
