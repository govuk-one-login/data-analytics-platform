# CloudFormation Import Identifiers

This document lists every resource with `DeletionPolicy: Retain` and the identifiers needed to import them back into a CloudFormation stack using `aws cloudformation import`.

## Import Reference Table

### S3 Buckets

| Logical ID                  | Resource Type   | Import Identifier Property | Physical ID Pattern                       |
|-----------------------------|-----------------|----------------------------|-------------------------------------------|
| `RawLayerBucket`            | AWS::S3::Bucket | `BucketName`               | `{env}-dap-raw-layer`                     |
| `StageLayerBucket`          | AWS::S3::Bucket | `BucketName`               | `{env}-dap-stage-layer`                   |
| `GlobalLogBucket`           | AWS::S3::Bucket | `BucketName`               | `{env}-dap-s3-logs`                       |
| `GlobalNonEventBucket`      | AWS::S3::Bucket | `BucketName`               | `{env}-dap-s3-non-event`                  |
| `VPCFlowLogsBucket`         | AWS::S3::Bucket | `BucketName`               | `{env}-dap-vpc-flow-logs`                 |
| `AthenaWorkgroupBucket`     | AWS::S3::Bucket | `BucketName`               | `{env}-dap-athena-workgroup`              |
| `ELTMetadataBucket`         | AWS::S3::Bucket | `BucketName`               | `{env}-dap-elt-metadata`                  |
| `StateMachineResultsBucket` | AWS::S3::Bucket | `BucketName`               | `{env}-dap-step-function-process-results` |
| `DataQualityMetricsBucket`  | AWS::S3::Bucket | `BucketName`               | `{env}-dap-data-quality-metrics`          |
| `FlywayFilesBucket`         | AWS::S3::Bucket | `BucketName`               | `{env}-dap-flyway-files`                  |
| `TrailBucket`               | AWS::S3::Bucket | `BucketName`               | `{env}-dap-cloud-trail`                   |
| `GlueJobResultsBucket`      | AWS::S3::Bucket | `BucketName`               | `{env}-dap-glue-job-process-results`      |
| `DAPAnalystsFilesBucket`    | AWS::S3::Bucket | `BucketName`               | `{env}-dap-analysts-files`                |
| `QuickSightLogBucket`       | AWS::S3::Bucket | `BucketName`               | `{env}-dap-quicksight-s3-logs`            |
| `QuicksightExportBucket`    | AWS::S3::Bucket | `BucketName`               | `{env}-dap-quicksight-exports`            |

### IAM Roles

| Logical ID                                                   | Resource Type  | Import Identifier Property | Physical ID Pattern                                                                                              |
|--------------------------------------------------------------|----------------|----------------------------|------------------------------------------------------------------------------------------------------------------|
| `IAMRoleRedshiftServerless`                                  | AWS::IAM::Role | `RoleName`                 | `{env}-redshift-serverless-role`                                                                                 |
| `IAMRoleKinesisFirehose`                                     | AWS::IAM::Role | `RoleName`                 | `{env}-kinesis-txma-firehose-role`                                                                               |
| `RawGlueCrawlerRole`                                         | AWS::IAM::Role | `RoleName`                 | `{env}-raw-glue-crawler-role`                                                                                    |
| `StepFunctionRole`                                           | AWS::IAM::Role | `RoleName`                 | `{env}-dap-statemachine-processing-role`                                                                         |
| `StepFunctionRedshiftProcessRole`                            | AWS::IAM::Role | `RoleName`                 | `{env}-dap-redshift-processing-role`                                                                             |
| `GlueScriptsExecutionRole`                                   | AWS::IAM::Role | `RoleName`                 | `{env}-dap-glue-scripts-execution-role`                                                                          |
| `RedshiftMigrationRole`                                      | AWS::IAM::Role | `RoleName`                 | `{env}-dap-redshift-migrate-role`                                                                                |
| `ELTMetadataUploadRole`                                      | AWS::IAM::Role | `RoleName`                 | `dap-elt-metadata-upload-role`                                                                                   |
| `FlywayFilesBucketUploadRole`                                | AWS::IAM::Role | `RoleName`                 | `dap-flyway-files-upload-role`                                                                                   |
| `HypercareAdjustedScheduleEventBridgeStateMachineInvokeRole` | AWS::IAM::Role | `RoleName`                 | `{env}-dap-hypercare-eventbridge-role`                                                                           |
| `ManualReferenceDataUploadRole`                              | AWS::IAM::Role | `RoleName`                 | `{env}-dap-manual-reference-data-upload-role`                                                                    |
| `AWSSupportReadOnlyRole`                                     | AWS::IAM::Role | `RoleName`                 | `AWS-Support-ReadOnly`                                                                                           |
| `DAPNotificationChatbotRole`                                 | AWS::IAM::Role | `RoleName`                 | `{stack-name}-notifications-chatbot-role`                                                                        |
| `DataAnalyticsADMRedshiftRole`                               | AWS::IAM::Role | `RoleName`                 | `data-analytics-adm-redshift-role`                                                                               |
| `ReferenceDataProcessingPipeRole`                            | AWS::IAM::Role | `RoleName`                 | Auto-generated — lookup: `aws iam list-roles --query "Roles[?contains(RoleName,'ReferenceDataProcessingPipe')]"` |
| `FlowLogRole`                                                | AWS::IAM::Role | `RoleName`                 | Auto-generated — lookup: `aws iam list-roles --query "Roles[?contains(RoleName,'FlowLog')]"`                     |
| `CloudTrailCloudWatchLogsRole`                               | AWS::IAM::Role | `RoleName`                 | Auto-generated — lookup: `aws iam list-roles --query "Roles[?contains(RoleName,'CloudTrailCloudWatch')]"`        |
| `QuicksightLambdasInvokeRole`                                | AWS::IAM::Role | `RoleName`                 | Auto-generated — lookup from stack resources                                                                     |

### Redshift Serverless

| Logical ID                    | Resource Type                      | Import Identifier Property | Physical ID Pattern                   |
|-------------------------------|------------------------------------|----------------------------|---------------------------------------|
| `RedshiftServerlessNamespace` | AWS::RedshiftServerless::Namespace | `NamespaceName`            | `{env}-redshift-serverless-ns`        |
| `RedshiftServerlessWorkgroup` | AWS::RedshiftServerless::Workgroup | `WorkgroupName`            | `{env}-redshift-serverless-workgroup` |

### Glue Resources

| Logical ID                                            | Resource Type                    | Import Identifier Property | Physical ID Pattern                                      |
|-------------------------------------------------------|----------------------------------|----------------------------|----------------------------------------------------------|
| `GlueSecurityConfig`                                  | AWS::Glue::SecurityConfiguration | `Name`                     | `{env}-dap-glue-security-configuration`                  |
| `RawGlueDatabase`                                     | AWS::Glue::Database              | `DatabaseName`             | `{env}-txma-raw`                                         |
| `StageGlueDatabase`                                   | AWS::Glue::Database              | `DatabaseName`             | `{env}-txma-stage`                                       |
| `DataQualityGlueDatabase`                             | AWS::Glue::Database              | `DatabaseName`             | `{env}-txma-data-quality-metrics`                        |
| `SustainabilityDatabase`                              | AWS::Glue::Database              | `DatabaseName`             | `{env}-sustainability`                                   |
| `GlueRedshiftConnection`                              | AWS::Glue::Connection            | `ConnectionName`           | `{env}-redshift-connection`                              |
| `RawStageTransformProcessPythonGlueJob`               | AWS::Glue::Job                   | `Name`                     | `{env}-dap-raw-stage-transform-process`                  |
| `DataQualityPythonGlueJob`                            | AWS::Glue::Job                   | `Name`                     | `{env}-dap-data-quality-metrics-generation`              |
| `DataQualityStageLayerOptimisedPythonGlueJob`         | AWS::Glue::Job                   | `Name`                     | `{env}-dap-data-quality-new-stage-metrics-generation`    |
| `SplunkMigratedRawStageTransformProcessPythonGlueJob` | AWS::Glue::Job                   | `Name`                     | `{env}-dap-splunk-migration-raw-stage-transform-process` |
| `ReferenceDataRedshiftIngestionGlueJob`               | AWS::Glue::Job                   | `Name`                     | `{env}-reference-data-redshift-ingestion-job`            |
| `SplunkRawLayerSingleTableCrawler`                    | AWS::Glue::Crawler               | `Name`                     | `splunk_migrated_data_fixed_schema`                      |
| `SplunkMigrationGlueTable`                            | AWS::Glue::Table                 | `DatabaseName\|TableName`  | `{env}-txma-raw\|splunk_migration`                       |
| `TxmaRefactoredTable`                                 | AWS::Glue::Table                 | `DatabaseName\|TableName`  | `{env}-txma-raw\|txma-refactored`                        |
| `DataQualityMetricsGlueTable`                         | AWS::Glue::Table                 | `DatabaseName\|TableName`  | `{env}-txma-data-quality-metrics\|data_quality_metrics`  |
| `CurTable`                                            | AWS::Glue::Table                 | `DatabaseName\|TableName`  | `{env}-sustainability\|cur`                              |

### KMS Keys

| Logical ID                   | Resource Type | Import Identifier Property | Physical ID Pattern                                                                                                     |
|------------------------------|---------------|----------------------------|-------------------------------------------------------------------------------------------------------------------------|
| `KmsKey`                     | AWS::KMS::Key | `KeyId`                    | Lookup: `aws kms list-aliases --query "Aliases[?AliasName=='{env}-dap-key'].TargetKeyId"`                               |
| `E2ETestProducerQueueKmsKey` | AWS::KMS::Key | `KeyId`                    | Lookup: `aws kms list-aliases --query "Aliases[?AliasName=='alias/{env}-dap-e2e-test-producer-queue-key'].TargetKeyId"` |
| `WAFLoggingKmsKey`           | AWS::KMS::Key | `KeyId`                    | Lookup from stack outputs or alias                                                                                      |
| `QuicksightAccessKmsKey`     | AWS::KMS::Key | `KeyId`                    | Lookup from stack outputs or alias                                                                                      |

### Secrets Manager

| Logical ID                     | Resource Type               | Import Identifier Property | Physical ID Pattern                                                                                                   |
|--------------------------------|-----------------------------|----------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `RedshiftSecret`               | AWS::SecretsManager::Secret | `Id`                       | Auto-generated ARN — lookup: `aws secretsmanager list-secrets --query "SecretList[?contains(Name,'RedshiftSecret')]"` |
| `SplunkPerformanceIndexSecret` | AWS::SecretsManager::Secret | `Id`                       | `{env}-SplunkPerformanceIndexSecret`                                                                                  |
| `SustainabilityAccountIds`     | AWS::SecretsManager::Secret | `Id`                       | `cur-account-ids`                                                                                                     |
| `GoogleCredentialsSecret`      | AWS::SecretsManager::Secret | `Id`                       | Lookup: `aws secretsmanager list-secrets --query "SecretList[?contains(Name,'GoogleCredentials')]"`                   |

### CloudTrail

| Logical ID                            | Resource Type          | Import Identifier Property | Physical ID Pattern        |
|---------------------------------------|------------------------|----------------------------|----------------------------|
| `CloudTrailForUnauthorizedAPIChanges` | AWS::CloudTrail::Trail | `TrailName`                | `UnauthorizedAPICallTrail` |
| `CloudTrailForIAMChanges`             | AWS::CloudTrail::Trail | `TrailName`                | `IAMPolicyChangeTrail`     |

### Log Groups

| Logical ID                                    | Resource Type       | Import Identifier Property | Physical ID Pattern                                            |
|-----------------------------------------------|---------------------|----------------------------|----------------------------------------------------------------|
| `AthenaRawLayerProcessingLogGroup`            | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/stepfunction/dap-process-raw-layer`                      |
| `RedshiftProcessingLogGroup`                  | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/stepfunction/dap-redshift-processing`                    |
| `RedshiftConsolidatedModelProcessingLogGroup` | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/stepfunction/dap-consolidated-stage-layer-to-redshift`   |
| `ADMConsolidatedModelProcessingLogGroup`      | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/stepfunction/dap-consolidated-conformed-layer-to-adm`    |
| `ADMV3RefreshLogGroup`                        | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/stepfunction/dap-consolidated-conformed-layer-to-adm-v3` |
| `UnauthorizedApiCallLogGroup`                 | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/dap-cloud-trail-log-group`                               |
| `IAMChangeLogGroup`                           | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/dap-IAM-changes-log-group`                               |
| `ProcessReferenceDataLogGroup`                | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/stepfunction/dap-reference-data-redshift-ingestion`      |
| `ProcessReferenceDapAlertLogGroup`            | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/events/reference-data-ingestion-pipeline-alert`          |
| `QuicksightApiAccessLogGroup`                 | AWS::Logs::LogGroup | `LogGroupName`             | `/aws/apigateway/{stack-name}-endpoint-access-logs`            |
| `cloudwatchLogsGroup`                         | AWS::Logs::LogGroup | `LogGroupName`             | `aws-waf-logs-{env}-dap-cloudWatchLog`                         |

### Athena

| Logical ID        | Resource Type          | Import Identifier Property | Physical ID Pattern         |
|-------------------|------------------------|----------------------------|-----------------------------|
| `AthenaWorkGroup` | AWS::Athena::WorkGroup | `Name`                     | `{env}-dap-txma-processing` |

### VPC and Networking

| Logical ID                       | Resource Type           | Import Identifier Property | Physical ID Pattern                                                                                                   |
|----------------------------------|-------------------------|----------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `VPCForDAP`                      | AWS::EC2::VPC           | `VpcId`                    | Lookup: `aws ec2 describe-vpcs --filters "Name=tag:Name,Values=dap-private-vpc"`                                      |
| `SubnetForDAP1`                  | AWS::EC2::Subnet        | `SubnetId`                 | Lookup: `aws ec2 describe-subnets --filters "Name=tag:Name,Values=dap-private-sn1"`                                   |
| `SubnetForDAP2`                  | AWS::EC2::Subnet        | `SubnetId`                 | Lookup: `aws ec2 describe-subnets --filters "Name=tag:Name,Values=dap-private-sn2"`                                   |
| `SubnetForDAP3`                  | AWS::EC2::Subnet        | `SubnetId`                 | Lookup: `aws ec2 describe-subnets --filters "Name=tag:Name,Values=dap-private-sn3"`                                   |
| `LambdaSecurityGroup`            | AWS::EC2::SecurityGroup | `GroupId`                  | Lookup: `aws ec2 describe-security-groups --filters "Name=group-name,Values={env}-dap-lambda-security-group"`         |
| `RedshiftAccessEC2SecurityGroup` | AWS::EC2::SecurityGroup | `GroupId`                  | Lookup: `aws ec2 describe-security-groups --filters "Name=tag:Name,Values=*Redshift*"` in the DAP VPC                 |
| `VpcEndpointSecurityGroup`       | AWS::EC2::SecurityGroup | `GroupId`                  | Lookup: `aws ec2 describe-security-groups --filters "Name=group-description,Values=Security Group for VPC Endpoints"` |
| `RouteTableForDAP`               | AWS::EC2::RouteTable    | `RouteTableId`             | Lookup: `aws ec2 describe-route-tables --filters "Name=tag:Name,Values=dap-private-rt"`                               |

### SNS Topics

| Logical ID                    | Resource Type   | Import Identifier Property | Physical ID Pattern                                                           |
|-------------------------------|-----------------|----------------------------|-------------------------------------------------------------------------------|
| `IAMChangeAlertSNSTopic`      | AWS::SNS::Topic | `TopicArn`                 | `arn:aws:sns:eu-west-2:{account}:IAMPolicyChangeAlert`                        |
| `UnauthorizedApiCallSNSTopic` | AWS::SNS::Topic | `TopicArn`                 | `arn:aws:sns:eu-west-2:{account}:UnauthorizedApiCallAlert`                    |
| `SNSAlertTopic`               | AWS::SNS::Topic | `TopicArn`                 | `arn:aws:sns:eu-west-2:{account}:{env}-dap-elt-support-management-topic`      |
| `SNSReferenceDataAlertTopic`  | AWS::SNS::Topic | `TopicArn`                 | `arn:aws:sns:eu-west-2:{account}:{env}-reference-data-ingestion-alerts-topic` |
| `DAPNotificationsTopic`       | AWS::SNS::Topic | `TopicArn`                 | `arn:aws:sns:eu-west-2:{account}:{stack-name}-alerts-notification-topic`      |
| `DAPAlertsSNSTopic`           | AWS::SNS::Topic | `TopicArn`                 | `arn:aws:sns:eu-west-2:{account}:{stack-name}-slack-di-dap-alerts-topic`      |

### EventBridge Rules

| Logical ID                                 | Resource Type     | Import Identifier Property | Physical ID Pattern                                                                          |
|--------------------------------------------|-------------------|----------------------------|----------------------------------------------------------------------------------------------|
| `RedshiftCreateSnapshotScheduledRule`      | AWS::Events::Rule | `Arn`                      | `arn:aws:events:eu-west-2:{account}:rule/{env}-dap-redshift-create-snapshot-rule`            |
| `S3NotificationsLoggerEventBridgeRule`     | AWS::Events::Rule | `Arn`                      | `arn:aws:events:eu-west-2:{account}:rule/{env}-dap-s3-notifications-logger-eventbridge-rule` |
| `HypercareAdjustedScheduleEventBridgeRule` | AWS::Events::Rule | `Arn`                      | `arn:aws:events:eu-west-2:{account}:rule/{env}-dap-hypercare-eventbridge-rule`               |
| `RedshiftErrorEventRule`                   | AWS::Events::Rule | `Arn`                      | `arn:aws:events:eu-west-2:{account}:rule/{env}-dap-redshift-error-rule`                      |

### SQS Queues

| Logical ID                       | Resource Type   | Import Identifier Property | Physical ID Pattern                                                                        |
|----------------------------------|-----------------|----------------------------|--------------------------------------------------------------------------------------------|
| `EventConsumerQueue`             | AWS::SQS::Queue | `QueueUrl`                 | `https://sqs.eu-west-2.amazonaws.com/{account}/{env}-placeholder-txma-event-queue`         |
| `EventConsumerDlq`               | AWS::SQS::Queue | `QueueUrl`                 | `https://sqs.eu-west-2.amazonaws.com/{account}/{env}-placeholder-txma-event-dlq`           |
| `ReferenceDataSQSQueue`          | AWS::SQS::Queue | `QueueUrl`                 | `https://sqs.eu-west-2.amazonaws.com/{account}/{env}-dap-reference-data-processing.fifo`   |
| `DeadLetterQueue`                | AWS::SQS::Queue | `QueueUrl`                 | `https://sqs.eu-west-2.amazonaws.com/{account}/{env}-reference-data-processing-dlq.fifo`   |
| `LambdaDeadLetterQueue`          | AWS::SQS::Queue | `QueueUrl`                 | `https://sqs.eu-west-2.amazonaws.com/{account}/{env}-reference-data-processing-lambda-dlq` |
| `RedshiftErrorDLQ`               | AWS::SQS::Queue | `QueueUrl`                 | `https://sqs.eu-west-2.amazonaws.com/{account}/{env}-dap-redshift-error-dlq`               |
| `E2ETestProducerQueue`           | AWS::SQS::Queue | `QueueUrl`                 | `https://sqs.eu-west-2.amazonaws.com/{account}/{env}-dap-e2e-test-producer-queue`          |
| `E2ETestProducerDeadLetterQueue` | AWS::SQS::Queue | `QueueUrl`                 | `https://sqs.eu-west-2.amazonaws.com/{account}/{env}-dap-e2e-test-producer-dlq`            |

### Kinesis Firehose

| Logical ID        | Resource Type                        | Import Identifier Property | Physical ID Pattern              |
|-------------------|--------------------------------------|----------------------------|----------------------------------|
| `KinesisFirehose` | AWS::KinesisFirehose::DeliveryStream | `DeliveryStreamName`       | `{env}-dap-txma-delivery-stream` |

### CloudWatch Alarms

| Logical ID                  | Resource Type          | Import Identifier Property | Physical ID Pattern                                         |
|-----------------------------|------------------------|----------------------------|-------------------------------------------------------------|
| `UnauthorizedApiCallAlarm`  | AWS::CloudWatch::Alarm | `AlarmName`                | `UnauthorizedAPICallAlarm`                                  |
| `IAMChangeAlarm`            | AWS::CloudWatch::Alarm | `AlarmName`                | `IAMPolicyChangeAlarm`                                      |
| `QuicksightSPICEUsageAlarm` | AWS::CloudWatch::Alarm | `AlarmName`                | Lookup from stack resources (name may include stack prefix) |

### Cognito

| Logical ID                       | Resource Type                | Import Identifier Property | Physical ID Pattern                                                                                      |
|----------------------------------|------------------------------|----------------------------|----------------------------------------------------------------------------------------------------------|
| `QuicksightAccessUserPool`       | AWS::Cognito::UserPool       | `UserPoolId`               | Lookup: `aws cognito-idp list-user-pools --max-results 50` (find pool with name containing "quicksight") |
| `QuicksightAccessUserPoolClient` | AWS::Cognito::UserPoolClient | `UserPoolId\|ClientId`     | Lookup: `aws cognito-idp list-user-pool-clients --user-pool-id {pool-id}`                                |
| `QuicksightAccessUserPoolDomain` | AWS::Cognito::UserPoolDomain | `Domain`                   | `{env}-dap-quicksight-access`                                                                            |

### Route53

| Logical ID   | Resource Type            | Import Identifier Property | Physical ID Pattern                     |
|--------------|--------------------------|----------------------------|-----------------------------------------|
| `HostedZone` | AWS::Route53::HostedZone | `HostedZoneId`             | Lookup: `aws route53 list-hosted-zones` |

---

## Resources That CANNOT Be Imported via CloudFormation

The following resource types do **not support** CloudFormation import:

| Logical ID                         | Resource Type                    | Recovery Steps                                                                                                                             |
|------------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `GlueRedshiftConnection`           | AWS::Glue::Connection            | Delete manually, let stack recreate it. Connection has no data — just config pointing to Redshift endpoint + secret.                       |
| `GlueSecurityConfig`               | AWS::Glue::SecurityConfiguration | Delete manually (`aws glue delete-security-configuration --name {env}-dap-glue-security-configuration`), let stack recreate. No data loss. |
| `SplunkRawLayerSingleTableCrawler` | AWS::Glue::Crawler               | Delete manually (`aws glue delete-crawler --name splunk_migrated_data_fixed_schema`), let stack recreate. Crawler config only — no data.   |

> **Note:** Check the [AWS CloudFormation resource type support page](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resource-import-supported-resources.html) for the latest list of importable types. The above was verified as of June 2026.

---

## Variable Reference

| Variable       | Description               | Example                                      |
|----------------|---------------------------|----------------------------------------------|
| `{env}`        | Environment name          | `dev`, `build`, `staging`, `production`      |
| `{account}`    | AWS Account ID            | `563887642259` (dev), `991664831801` (build) |
| `{stack-name}` | CloudFormation stack name | `di-data-dap`                                |
