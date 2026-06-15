# CloudFormation Stack Deletion & Recreation — Resource Import Solution

## Problem Statement

When the DAP main CloudFormation stack is deleted, many resources fail to delete properly (e.g. non-empty S3 buckets, named IAM roles, Redshift namespaces). When attempting to recreate the stack, CloudFormation fails with "resource already exists" errors because these orphaned resources still exist in the AWS account.

This document identifies all affected resources, proposes a solution using CloudFormation resource imports, provides a step-by-step implementation plan, and estimates delivery timelines.

---

## Affected Resources

### Category 1: S3 Buckets

Non-empty S3 buckets cannot be deleted by CloudFormation. They remain in the account and block stack recreation.

| Logical Resource ID | Bucket Name |
|---|---|
| `RawLayerBucket` | `${Environment}-dap-raw-layer` |
| `StageLayerBucket` | `${Environment}-dap-stage-layer` |
| `GlobalLogBucket` | `${Environment}-dap-s3-logs` |
| `GlobalNonEventBucket` | `${Environment}-dap-s3-non-event` |
| `VPCFlowLogsBucket` | `${Environment}-dap-vpc-flow-logs` |
| `AthenaWorkgroupBucket` | `${Environment}-dap-athena-workgroup` |
| `ELTMetadataBucket` | `${Environment}-dap-elt-metadata` |
| `StateMachineResultsBucket` | `${Environment}-dap-step-function-process-results` |
| `DataQualityMetricsBucket` | `${Environment}-dap-data-quality-metrics` |
| `FlywayFilesBucket` | `${Environment}-dap-flyway-files` |
| `TrailBucket` | `${Environment}-dap-cloud-trail` |
| `GlueJobResultsBucket` | `${Environment}-dap-glue-job-process-results` |
| `DAPAnalystsFilesBucket` | `${Environment}-dap-analysts-files` |

### Category 2: Named IAM Roles

Named IAM roles that are retained or fail to delete due to dependencies.

| Logical Resource ID | Role Name |
|---|---|
| `IAMRoleRedshiftServerless` | `${Environment}-redshift-serverless-role` |
| `IAMRoleKinesisFirehose` | `${Environment}-kinesis-txma-firehose-role` |
| `RawGlueCrawlerRole` | `${Environment}-raw-glue-crawler-role` |
| `StepFunctionRole` | `${Environment}-dap-statemachine-processing-role` |
| `StepFunctionRedshiftProcessRole` | `${Environment}-dap-redshift-processing-role` |
| `GlueScriptsExecutionRole` | `${Environment}-dap-glue-scripts-execution-role` |
| `RedshiftMigrationRole` | `${Environment}-dap-redshift-migrate-role` |
| `ELTMetadataUploadRole` | `dap-elt-metadata-upload-role` |
| `FlywayFilesBucketUploadRole` | `dap-flyway-files-upload-role` |
| `HypercareAdjustedScheduleEventBridgeStateMachineInvokeRole` | `${Environment}-dap-hypercare-eventbridge-role` |
| `ManualReferenceDataUploadRole` | `${Environment}-dap-manual-reference-data-upload-role` |
| `AWSSupportReadOnlyRole` | `AWS-Support-ReadOnly` |
| `DAPNotificationChatbotRole` | `${AWS::StackName}-notifications-chatbot-role` |
| `DataAnalyticsADMRedshiftRole` | `data-analytics-adm-redshift-role` |
| `ReferenceDataProcessingPipeRole` | (auto-generated name) |
| `FlowLogRole` | (auto-generated name) |
| `CloudTrailCloudWatchLogsRole` | (auto-generated name) |

### Category 3: Redshift Serverless

Stateful resources. The namespace contains all database data. Workgroup/namespace names are unique per account.

| Logical Resource ID | Name |
|---|---|
| `RedshiftServerlessNamespace` | `${Environment}-redshift-serverless-ns` |
| `RedshiftServerlessWorkgroup` | `${Environment}-redshift-serverless-workgroup` |

### Category 4: Glue Resources

Named Glue resources that persist after stack deletion.

| Logical Resource ID | Name |
|---|---|
| `GlueSecurityConfig` | `${Environment}-dap-glue-security-configuration` |
| `RawGlueDatabase` | `${Environment}-txma-raw` |
| `StageGlueDatabase` | `${Environment}-txma-stage` |
| `DataQualityGlueDatabase` | `${Environment}-txma-data-quality-metrics` |
| `SustainabilityDatabase` | `${Environment}-sustainability` |
| `GlueRedshiftConnection` | `${Environment}-redshift-connection` |
| `RawStageTransformProcessPythonGlueJob` | `${Environment}-dap-raw-stage-transform-process` |
| `DataQualityPythonGlueJob` | `${Environment}-dap-data-quality-metrics-generation` |
| `DataQualityStageLayerOptimisedPythonGlueJob` | `${Environment}-dap-data-quality-new-stage-metrics-generation` |
| `SplunkMigratedRawStageTransformProcessPythonGlueJob` | `${Environment}-dap-splunk-migration-raw-stage-transform-process` |
| `ReferenceDataRedshiftIngestionGlueJob` | `${Environment}-reference-data-redshift-ingestion-job` |

### Category 5: KMS Keys

KMS keys cannot be immediately deleted (7-30 day waiting period). Aliases block recreation.

| Logical Resource ID | Alias |
|---|---|
| `KmsKey` / `KmsKeyAlias` | `alias/${Environment}-dap-key` |
| `E2ETestProducerQueueKmsKey` / `E2ETestProducerQueueKmsKeyAlias` | `alias/${Environment}-dap-e2e-test-producer-queue-key` |

### Category 6: Secrets Manager

Secrets with `DeletionPolicy: Retain` or that have a recovery window blocking immediate deletion.

| Logical Resource ID | Name | Notes |
|---|---|---|
| `RedshiftSecret` | (auto-generated) | Referenced by Redshift; critical to retain |
| `SplunkPerformanceIndexSecret` | `${Environment}-SplunkPerformanceIndexSecret` | Already has `DeletionPolicy: Retain` |
| `SustainabilityAccountIds` | `cur-account-ids` | Already has `DeletionPolicy: Retain` |

### Category 7: CloudTrail

Named trails that block recreation.

| Logical Resource ID | Trail Name |
|---|---|
| `CloudTrailForUnauthorizedAPIChanges` | `UnauthorizedAPICallTrail` |
| `CloudTrailForIAMChanges` | `IAMPolicyChangeTrail` |

### Category 8: Log Groups

Named log groups that persist after stack deletion.

| Logical Resource ID | Log Group Name |
|---|---|
| `AthenaRawLayerProcessingLogGroup` | `/aws/stepfunction/dap-process-raw-layer` |
| `RedshiftProcessingLogGroup` | `/aws/stepfunction/dap-redshift-processing` |
| `RedshiftConsolidatedModelProcessingLogGroup` | `/aws/stepfunction/dap-consolidated-stage-layer-to-redshift` |
| `ADMConsolidatedModelProcessingLogGroup` | `/aws/stepfunction/dap-consolidated-conformed-layer-to-adm` |
| `ADMV3RefreshLogGroup` | `/aws/stepfunction/dap-consolidated-conformed-layer-to-adm-v3` |
| `UnauthorizedApiCallLogGroup` | `/aws/dap-cloud-trail-log-group` |
| `IAMChangeLogGroup` | `/aws/dap-IAM-changes-log-group` |
| `ProcessReferenceDataLogGroup` | `/aws/stepfunction/dap-reference-data-redshift-ingestion` |
| `ProcessReferenceDapAlertLogGroup` | `/aws/events/reference-data-ingestion-pipeline-alert` |

### Category 9: Athena WorkGroup

| Logical Resource ID | Name |
|---|---|
| `AthenaWorkGroup` | `${Environment}-dap-txma-processing` |

### Category 10: VPC and Networking

Lambda ENIs can take 20+ minutes to detach. Redshift workgroup must be deleted first. These resources block VPC deletion.

| Logical Resource ID | Notes |
|---|---|
| `VPCForDAP` | Core VPC — all other networking depends on this |
| `SubnetForDAP1` | Subnet in AZ 1 |
| `SubnetForDAP2` | Subnet in AZ 2 |
| `SubnetForDAP3` | Subnet in AZ 3 |
| `LambdaSecurityGroup` | Named: `${Environment}-dap-lambda-security-group` |
| `RedshiftAccessEC2SecurityGroup` | Security group for Redshift access |
| `VpcEndpointSecurityGroup` | Security group for VPC endpoints |
| `RouteTableForDAP` | Route table for private subnets |

### Category 11: SNS Topics

Named topics that block recreation.

| Logical Resource ID | Topic Name |
|---|---|
| `IAMChangeAlertSNSTopic` | `IAMPolicyChangeAlert` |
| `UnauthorizedApiCallSNSTopic` | `UnauthorizedApiCallAlert` |
| `SNSAlertTopic` | `${Environment}-dap-elt-support-management-topic` |
| `SNSReferenceDataAlertTopic` | `${Environment}-reference-data-ingestion-alerts-topic` |
| `DAPNotificationsTopic` | `${AWS::StackName}-alerts-notification-topic` |

### Category 12: EventBridge Rules

Named rules that block recreation.

| Logical Resource ID | Rule Name |
|---|---|
| `RedshiftCreateSnapshotScheduledRule` | `${Environment}-dap-redshift-create-snapshot-rule` |
| `S3NotificationsLoggerEventBridgeRule` | `${Environment}-dap-s3-notifications-logger-eventbridge-rule` |
| `HypercareAdjustedScheduleEventBridgeRule` | `${Environment}-dap-hypercare-eventbridge-rule` |
| `RedshiftErrorEventRule` | `${Environment}-dap-redshift-error-rule` |

### Category 13: SQS Queues

Named queues that block recreation.

| Logical Resource ID | Queue Name |
|---|---|
| `EventConsumerQueue` | `${Environment}-placeholder-txma-event-queue` |
| `EventConsumerDlq` | `${Environment}-placeholder-txma-event-dlq` |
| `ReferenceDataSQSQueue` | `${Environment}-dap-reference-data-processing.fifo` |
| `DeadLetterQueue` | `${Environment}-reference-data-processing-dlq.fifo` |
| `LambdaDeadLetterQueue` | `${Environment}-reference-data-processing-lambda-dlq` |
| `RedshiftErrorDLQ` | `${Environment}-dap-redshift-error-dlq` |
| `E2ETestProducerQueue` | `${Environment}-dap-e2e-test-producer-queue` |
| `E2ETestProducerDeadLetterQueue` | `${Environment}-dap-e2e-test-producer-dlq` |

---

## Proposed Solution

Use a combination of `DeletionPolicy: Retain` / `UpdateReplacePolicy: Retain` on stateful resources, and CloudFormation resource imports to bring orphaned resources back into a new stack.

### How CloudFormation Import Works

1. You create a change set of type `IMPORT`
2. You provide a `resources-to-import.json` file mapping logical resource IDs to physical resource identifiers
3. CloudFormation adopts the existing resources into the stack without creating or modifying them
4. Subsequent stack updates can then modify the imported resources as normal

---

## Implementation Plan

### Phase 1: Add Retention Policies to IaC

Add `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain` to all resources identified above that hold data or state, or that have names which would conflict on recreation.

**Resources to add retain policies to:**

- All 13 S3 Buckets
- All named IAM Roles
- Redshift Namespace and Workgroup
- All Glue Databases, Tables, Jobs, Security Configuration, and Connection
- KMS Keys and Aliases
- RedshiftSecret
- Both CloudTrail trails
- All Log Groups
- Athena WorkGroup
- VPC, Subnets, Security Groups, Route Table
- All SNS Topics
- All EventBridge Rules
- All SQS Queues

**Example change (raw.yml):**

```yaml
RawLayerBucket:
  Type: 'AWS::S3::Bucket'
  DeletionPolicy: Retain
  UpdateReplacePolicy: Retain
  Properties:
    # ... existing properties unchanged
```

**Deploy this change to all environments** — this is non-destructive and simply tells CloudFormation to leave these resources in place if the stack is ever deleted.

### Phase 2: Document Import Identifiers

For each resource type, document the identifier needed for CloudFormation import:

| Resource Type | Import Identifier Key | Example Value |
|---|---|---|
| `AWS::S3::Bucket` | `BucketName` | `dev-dap-raw-layer` |
| `AWS::IAM::Role` | `RoleName` | `dev-redshift-serverless-role` |
| `AWS::KMS::Key` | `KeyId` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AWS::KMS::Alias` | `AliasName` | `alias/dev-dap-key` |
| `AWS::Glue::Database` | `Name` | `dev-txma-raw` |
| `AWS::Glue::Table` | `DatabaseName`, `Name` | `dev-txma-raw`, `txma-refactored` |
| `AWS::Glue::Job` | `Name` | `dev-dap-raw-stage-transform-process` |
| `AWS::Glue::SecurityConfiguration` | `Name` | `dev-dap-glue-security-configuration` |
| `AWS::Glue::Connection` | `Name` | `dev-redshift-connection` |
| `AWS::RedshiftServerless::Namespace` | `NamespaceName` | `dev-redshift-serverless-ns` |
| `AWS::RedshiftServerless::Workgroup` | `WorkgroupName` | `dev-redshift-serverless-workgroup` |
| `AWS::SecretsManager::Secret` | `Id` | ARN of the secret |
| `AWS::Logs::LogGroup` | `LogGroupName` | `/aws/stepfunction/dap-process-raw-layer` |
| `AWS::CloudTrail::Trail` | `TrailName` | `UnauthorizedAPICallTrail` |
| `AWS::Athena::WorkGroup` | `Name` | `dev-dap-txma-processing` |
| `AWS::EC2::VPC` | `VpcId` | `vpc-xxxxxxxxxxxxxxxxx` |
| `AWS::EC2::Subnet` | `SubnetId` | `subnet-xxxxxxxxxxxxxxxxx` |
| `AWS::EC2::SecurityGroup` | `GroupId` | `sg-xxxxxxxxxxxxxxxxx` |
| `AWS::EC2::RouteTable` | `RouteTableId` | `rtb-xxxxxxxxxxxxxxxxx` |
| `AWS::SNS::Topic` | `TopicArn` | `arn:aws:sns:eu-west-2:123456789012:...` |
| `AWS::SQS::Queue` | `QueueUrl` | `https://sqs.eu-west-2.amazonaws.com/...` |
| `AWS::Events::Rule` | `Arn` | `arn:aws:events:eu-west-2:123456789012:rule/...` |
| `AWS::EC2::VPCEndpoint` | `VpcEndpointId` | `vpce-xxxxxxxxxxxxxxxxx` |

### Phase 3: Create Import Script

Create a script at `scripts/import-retained-resources.sh` that:

1. Takes `ENVIRONMENT` as input
2. Queries AWS for all retained resources using AWS CLI (by name/tag)
3. Generates the `resources-to-import.json` file
4. Creates a CloudFormation import change set
5. Executes the change set

**Example resources-to-import.json:**

```json
[
  {
    "ResourceType": "AWS::S3::Bucket",
    "LogicalResourceId": "GlobalLogBucket",
    "ResourceIdentifier": {
      "BucketName": "dev-dap-s3-logs"
    }
  },
  {
    "ResourceType": "AWS::S3::Bucket",
    "LogicalResourceId": "RawLayerBucket",
    "ResourceIdentifier": {
      "BucketName": "dev-dap-raw-layer"
    }
  },
  {
    "ResourceType": "AWS::RedshiftServerless::Namespace",
    "LogicalResourceId": "RedshiftServerlessNamespace",
    "ResourceIdentifier": {
      "NamespaceName": "dev-redshift-serverless-ns"
    }
  },
  {
    "ResourceType": "AWS::KMS::Key",
    "LogicalResourceId": "KmsKey",
    "ResourceIdentifier": {
      "KeyId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  }
]
```

**Example import command:**

```bash
aws cloudformation create-change-set \
  --stack-name dap-main-dev \
  --change-set-name import-retained-resources \
  --change-set-type IMPORT \
  --resources-to-import file://resources-to-import.json \
  --template-body file://template.yaml \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND

aws cloudformation execute-change-set \
  --stack-name dap-main-dev \
  --change-set-name import-retained-resources
```

### Phase 4: Test in Dev Environment

1. Deploy the retain policies to dev
2. Delete the dev stack
3. Verify which resources remain
4. Run the import script to recreate the stack with imported resources
5. Iterate on dependency ordering and fix any issues
6. Verify the stack is fully functional after import

**Important: The import must be done in stages due to resource dependencies:**

- **Stage 1**: Import foundational resources (KMS Key, VPC, Subnets, Security Groups, Route Table, S3 Buckets)
- **Stage 2**: Import resources that depend on Stage 1 (IAM Roles, Glue Databases, Log Groups, Secrets)
- **Stage 3**: Import resources that depend on Stage 2 (Redshift, Glue Jobs, CloudTrail, Athena)
- **Stage 4**: Deploy remaining resources that don't support import (Lambdas, State Machines, Pipes) via a normal stack update

### Phase 5: Document and Automate

1. Create a runbook documenting the full recovery process
2. Optionally create a GitHub Action for the import process
3. Document any manual steps required (e.g. looking up VPC IDs)

---

## Resources That Do NOT Support CloudFormation Import

The following resource types in the stack do **not** support CloudFormation import and will need to be recreated (they are stateless so this is acceptable):

| Resource Type | Examples in Stack |
|---|---|
| `AWS::Serverless::Function` | All Lambda functions (EventConsumerLambda, AthenaGetConfigLambda, etc.) |
| `AWS::Serverless::StateMachine` | All Step Functions |
| `AWS::Pipes::Pipe` | `ReferenceDataProcessingPipe` |
| `AWS::Chatbot::SlackChannelConfiguration` | `DAPNotificationsChatbotConfiguration` |
| `AWS::Lambda::EventSourceMapping` | `EventConsumerEventSourceMapping` |
| `AWS::Lambda::Permission` | All Lambda permission resources |
| `AWS::KinesisFirehose::DeliveryStream` | `KinesisFirehose` |
| `AWS::CloudFront::Distribution` | `CloudFrontDistribution` |
| `AWS::CloudFront::OriginAccessControl` | `OriginAccessControl` |
| `AWS::CloudFront::CloudFrontOriginAccessIdentity` | `CloudFrontOAI` |
| `AWS::Glue::Crawler` | `SplunkRawLayerSingleTableCrawler` |
| `AWS::SSM::Parameter` | All SSM parameters (test support) |
| `AWS::EC2::FlowLog` | `FlowLogs` |
| `AWS::EC2::SubnetRouteTableAssociation` | All route table associations |
| `AWS::Logs::MetricFilter` | `UnauthorizedApiCallMetricFilter`, `IAMChangeMetricFilter` |
| `AWS::Logs::SubscriptionFilter` | `RedshiftErrorSubscriptionFilter` |
| `AWS::CloudWatch::Alarm` | `UnauthorizedApiCallAlarm`, `IAMChangeAlarm` |
| `AWS::SNS::Subscription` | All SNS subscriptions |
| `AWS::SNS::TopicPolicy` | All topic policies |
| `AWS::S3::BucketPolicy` | All bucket policies |
| `AWS::SQS::QueuePolicy` | All queue policies |
| `AWS::IAM::Policy` | `QuickSightEnvironmentPolicy`, `GluePolicy` |
| `AWS::IAM::ManagedPolicy` | All managed policies in pipeline.yml |
| `AWS::SecretsManager::RotationSchedule` | `RedshiftSecretRotationSchedule` |

These resources are either stateless or are policies/permissions that will be recreated automatically when the stack is updated after the import.

---

## Additional Considerations

### Redshift FinalSnapshotName Conflict

The `RedshiftServerlessNamespace` has `FinalSnapshotName: ${Environment}-redshift-snapshot`. If the stack is deleted and a snapshot with this name already exists, the deletion will fail. Consider making this dynamic:

```yaml
FinalSnapshotName: !Sub '${Environment}-redshift-snapshot-${AWS::StackName}'
```

### KMS Key Deletion Window

KMS keys have a mandatory 7-30 day waiting period before deletion. If the stack is deleted and recreated within this window, the alias will conflict. The retain policy prevents this issue entirely.

### VPC ENI Cleanup

When Lambdas in a VPC are deleted, their ENIs can take 20+ minutes to be cleaned up by AWS. During this time, the VPC, subnets, and security groups cannot be deleted. Retaining the VPC resources avoids this issue.

### Secrets Manager Recovery Window

By default, deleted secrets have a 30-day recovery window during which they cannot be recreated with the same name. Adding `DeletionPolicy: Retain` prevents this.

### CloudFormation Import Limits

- Maximum 200 resources can be imported in a single change set
- The template used for import must match the current state of the resources
- Resources being imported must not already be managed by another stack

---

## Delivery Estimates

| Phase | Description | Estimate |
|---|---|---|
| Phase 1 | Add `DeletionPolicy: Retain` / `UpdateReplacePolicy: Retain` to all identified resources across all IaC files | 1-2 days |
| Phase 2 | Document import identifiers for all resource types; create mapping template | 1 day |
| Phase 3 | Build the import script that generates `resources-to-import.json` and executes the import | 2-3 days |
| Phase 4 | Test the full delete-and-reimport cycle in dev (iterating on dependency ordering, fixing issues) | 3-5 days |
| Phase 5 | Document the recovery process; create runbook/GitHub Action | 1 day |
| **Total** | | **8-12 days** |

### Risk Factors That Could Extend Timeline

- Discovery of additional resources not identified in this analysis
- CloudFormation import failures due to resource state drift
- Dependency ordering issues requiring multiple import stages
- Resources that have been modified outside of CloudFormation (drift)
- Secure Pipelines constraints on the import process in higher environments

---

## Summary

The core approach is:

1. **Prevent the problem**: Add `DeletionPolicy: Retain` to all stateful/named resources so they survive stack deletion
2. **Enable recovery**: Use CloudFormation resource import to adopt orphaned resources back into a new stack
3. **Automate**: Provide a script/runbook that makes the recovery process repeatable and reliable

This ensures that if a stack is deleted (intentionally or accidentally), the team can recreate it without manually deleting orphaned resources or losing data.
