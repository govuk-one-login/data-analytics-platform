# Orphaned Resources — dev (563887642259)

Audit date: 2026-05-19
Filters applied: IaC resources (Environment=dev), AWSAccelerator resources, Redshift Glue schemas

## S3 Buckets (76)

- 563887642259-athena-processing-raw-layer-demo
- 563887642259-athena-processing-stage-layer-demo
- 563887642259-athena-query-output
- 563887642259-athena-workgroup-queries-demo1
- 563887642259-benefit-model-data
- 563887642259-elt-metadata-demo
- 563887642259-lambda-zips
- 563887642259-live-service-data-sample
- 563887642259-qa-testing
- 563887642259-sb-demo-metadata-rules
- 563887642259-sb-demo-staging-reference-data-sets
- appcomposer-neqg.ajbiqzhnr.h-eu-west-2
- athena-test-workgroup-data
- athena-test-workgroup-results
- aws-accelerator-s3-access-logs-563887642259-eu-west-1
- aws-accelerator-s3-access-logs-563887642259-eu-west-2
- aws-accelerator-s3-access-logs-563887642259-us-east-1
- aws-accelerator-s3-access-logs-563887642259-us-west-1
- aws-accelerator-s3-access-logs-563887642259-us-west-2
- aws-athena-query-results-563887642259-eu-west-2
- aws-athena-query-results-eu-west-2-563887642259
- aws-cloudtrail-apprentice-task
- aws-glue-assets-563887642259-eu-west-2
- aws-sam-cli-managed-default-samclisourcebucket-1eqe7s0fb5huf
- cdk-accel-assets-563887642259-eu-west-2
- cf-templates-16qtj3jourgdj-eu-west-2
- cf-templates-16qtj3jourgdj-us-east-1
- covid-public
- coviddataii
- dap-athena-workgroup-new
- dap-data-quality-metrics-new
- dap-dev-deploy-quicksigh-githubartifactsourcebuck-nqxh5lojxoh
- dap-dev-deploy-quicksight-access-pipelinebucket-1153z1kol13jc
- dap-dev-deploy-quicksight-access-s3logs-0a6f4770887a
- dap-dev-splunk-events
- dap-installables
- dap-raw-layer-new
- dap-synthesizer-artefacts
- dap-txma-reconciliation-results
- demo-pipeline-githubartifactsourcebucket-pdb2ecthlkvb
- demo-pipeline-pipelinebucket-hmyzwgqyxvs0
- demo-pipeline-s3logs-0a3ca7455b69
- dev-dap-athena-workgroup-2
- dev-dap-cloud-trail-2
- dev-dap-cloud-trail-new
- dev-dap-data-quality-metrics-2
- dev-dap-data-quality-metrics-old
- dev-dap-elt-metadata-2
- dev-dap-elt-metadata-new
- dev-dap-flyway-files-new
- dev-dap-quicksight-exports-new
- dev-dap-quicksight-s3-logs-new
- dev-dap-raw-layer-2
- dev-dap-raw-layer-old
- dev-dap-raw-layer-testing
- dev-dap-s3-logs-new
- dev-dap-stage-layer-2
- dev-dap-stage-layer-new
- dev-dap-stage-layer-old
- dev-dap-stage2-layer
- dev-dap-step-function-process-results-new
- dev-dap-step-function-process-results-old
- dev-dap-vpc-flow-logs-2
- dev-richa-dap-sustainability
- dev-richa-dap-sustainability-1
- di-dap-dap-dev-tfstate
- di-dap-dev-tfstate
- di-lb-access-logs-563887642259-eu-west-2
- di-s3-access-logs-563887642259-eu-west-2
- option-b-event-data
- richa-test-bucket-1
- secure-pipelines-pipelin-githubartifactsourcebuck-i3f1tk1mewia
- secure-pipelines-pipeline-pipelinebucket-u3w45054pbxu
- secure-pipelines-pipeline-s3logs-0ac4f1a0d400
- sustainability-pipeline-githubartifactsourcebucket-owzpdw9jgnoc
- sustainability-pipeline-pipelinebucket-dyriavrphnyk
- sustainability-pipeline-s3logs-0aa9cc929cbd
- sustainability-poc
- txma-events-dev

## Lambda Functions (7)

- secret-py2 (python3.11, 2023-08-02)
- 563887642259-sb-demo-send-to-sqs (python3.9, 2024-03-14)
- 563887642259-get-datasource-config-file (python3.10, 2023-05-23)
- aws-controltower-NotificationForwarder (python3.13, 2025-07-14)
- lambda-invoke-logging-test (nodejs22.x, 2025-03-24)
- richaTest (python3.13, 2024-12-03)
- readDatasourceConfig (python3.10, 2023-05-17)

## SQS Queues (3)

- 563887642259-sb-demo-ref-data-processing-dlq.fifo
- 563887642259-sb-demo-ref-data-processing.fifo
- backup-vault-monitoring-EventBusRuleDLQ

## Step Functions (0)

None — all accounted for in IaC.

## Glue Databases (4)

- default
- dev-txma-reconcilation
- dev-txma-stage2
- txma-raw-testing

## Glue Jobs (3)

- DataForIncrementalCrawler
- demo-dap-raw-stage-transform-process
- dev-dap-raw-stage-transform-process-refactor

## Glue Crawlers (5)

- dap-sustainability-crawler
- gpgscores
- poc_single_schema
- poc_single_schema_validation
- test-crawler

## Redshift Serverless (0)

None — accounted for in IaC.

## CloudWatch Log Groups (109)

High storage (delete or set retention):
- /aws/lambda/option-c-lamda-kinesis-s3-txma-consumer (17,059 MB, retention: never)
- /aws/lambda/option-b-lambda (8,344 MB, retention: never)
- /aws/codebuild/Deploy-secure-pipelines-pipeline (95 MB, retention: never)
- /aws/redshift/dev-redshift-serverless-ns/useractivitylog (13.74 MB)
- StackSet-AWSControlTowerBP-VPC-ACCOUNT-FACTORY-V1-...-VPCFlowLogsLogGroup (13.58 MB, retention: never)
- /aws/lambda/563887642259-qa-testing (1.60 MB, retention: never)

Empty/low storage orphans:
- /aws-glue-databrew/jobs-benefit-model-cost-databrew-test
- /aws-glue/crawlers
- /aws-glue/crawlers-role/dev-raw-glue-crawler-role-* (7 groups)
- /aws-glue/data-quality/error
- /aws-glue/data-quality/output
- /aws-glue/jobs/* (10 groups)
- /aws-glue/python-jobs/* (12 groups)
- /aws-glue/sessions/error
- /aws-glue/sessions/output
- /aws-glue/testconnection/* (6 groups)
- /aws/apigateway/dap-quicksight-access-endpoint-access-logs
- /aws/codebuild/Deploy-dap-dev-deploy-quicksight-access
- /aws/codebuild/Deploy-demo-pipeline
- /aws/codebuild/Deploy-sustainability-pipeline
- /aws/codebuild/Test-secure-pipelines-pipeline
- /aws/codebuild/Test-sustainability-pipeline
- /aws/events/sb-demo-alerting
- /aws/kinesisfirehose/PUT-S3-4rq8t
- /aws/kinesisfirehose/PUT-S3-MKt9K
- /aws/kinesisfirehose/dev-dap-txma-delivery-stream-optimised
- /aws/kinesisfirehose/option-a-sqs-eventbridgepipes-kinesis
- /aws/kinesisfirehose/option-a-sqs-sns-kinesis
- /aws/kinesisfirehose/option-c-lambda-kinesis-firehose
- /aws/kinesisfirehose/txma-dynamic-filtering
- /aws/lambda/563887642259-get-* (6 groups)
- /aws/lambda/563887642259-qa-testing
- /aws/lambda/563887642259-sb-demo-* (2 groups)
- /aws/lambda/CreateRedshiftSnapshot
- /aws/lambda/athena-permissions-test
- /aws/lambda/aws-controltower-NotificationForwarder
- /aws/lambda/clean-lambda
- /aws/lambda/cross-account-data-sync-dev
- /aws/lambda/dap-data-synthesizer
- /aws/lambda/dap-txma-reconciliation
- /aws/lambda/dev-dap-vpc-NetworkFirewallENILambda-rxTtQAVCWjCc
- /aws/lambda/dummyfunction
- /aws/lambda/ec2-access-test
- /aws/lambda/extract-txma-self-serve-config-events-attributes
- /aws/lambda/getInsertStatement
- /aws/lambda/getPartitionQuery
- /aws/lambda/hello-world
- /aws/lambda/lambda-invoke-logging-test
- /aws/lambda/option-a-clean-put
- /aws/lambda/powertools-test
- /aws/lambda/quicksight-add-users
- /aws/lambda/quicksight-add-users-from-spreadsheet
- /aws/lambda/quicksight-sync-users
- /aws/lambda/readDatasourceConfig
- /aws/lambda/redshift-access-ec2-scheduler-dev
- /aws/lambda/redshift-create-snapshot-2
- /aws/lambda/redshift-rotate-secret-2
- /aws/lambda/richaTest
- /aws/lambda/richaTest1
- /aws/lambda/s3-notifications-logger-dev-2
- /aws/lambda/sb-reference-data-ingestion-pipe-SendToSqsFunction-*
- /aws/lambda/sc-pipes-test-lambda
- /aws/lambda/secret-py
- /aws/lambda/secret-r
- /aws/lambda/secret-rotate
- /aws/lambda/send-replication-alerts-dev
- /aws/lambda/sns-test-function
- /aws/lambda/temp-body-logger
- /aws/lambda/temp-test-ec2-shutdown
- /aws/lambda/test-dynamo-connector
- /aws/lambda/test-support-lambda-test
- /aws/lambda/trigger-txma-crawler-dev
- /aws/lambda/txma-event-consumer-2
- /aws/lambda/txma-events-consumer-dev
- /aws/lambda/txma-events-consumer-staging
- /aws/lambda/update-apigateway-stage
- /aws/redshift/db-rename-testing/useractivitylog
- /aws/redshift/dev-redshift-serverless-namespace/useractivitylog
- /aws/redshift/dev-redshift-serverless-ns-2/useractivitylog
- /aws/stepfunction/reference-data-processing
- /aws/vendedlogs/dev-dap-vpc-firewall-alerts
- /aws/vendedlogs/states/dap-txma-athena-processing-Logs
- /aws/vendedlogs/states/unit-testing-dev-dap-raw-to-stage-Logs
- dev-dap-txma-delivery-stream
- dev-dap-txma-delivery-stream-2
- dev-dap-vpc-FlowLogLogGroup-m0BnCoh7FiO0
- jupyternotebook/error
- jupyternotebook/output

## Secrets Manager (3)

- SelfServeConfigGitToken (last accessed: 2024-10-23)
- RedshiftSecret-g4es94EyWXC7 (last accessed: 2026-03-25)
- RedshiftSecret-5FfggGc4OOjg (last accessed: 2026-05-15)

## SSM Parameters (12)

- /cdk-bootstrap/accel/version
- /inspector-aws/service/inspector-linux-application-paths
- /tests/dap/dapAthenaRawLayerDatabase
- /tests/dap/dapAthenaStageLayerDatabase
- /tests/dap/dapAthenaWorkgroup
- /tests/dap/dapRawLayerBucket
- /tests/dap/dapTXMAConsumerSQSQueueUrl
- /tests/dap/glueLogGroup
- /tests/dap/rawToStageStepFunction
- /tests/dap/redshiftWorkgroupName
- /tests/dap/stageToConformStepFunction
- /tests/dap/redshiftSecretArn

Note: /tests/dap/* appear to be from an older naming convention (IaC now uses /tests/di-data-dap/*).

## IAM Roles (25)

- dap-data-synthesizer-role-bii6wyuu (2023-04-23)
- dap-dev-deploy-quicksight-access-CodePipelineRole-QZGVEnlACfYp (2024-10-24)
- dap-dev-deploy-quicksight-access-GitHubActionsRole-8TAEQEANyzSz (2024-10-29)
- dap-dev-deploy-quicksight-GitHubActionsValidateRole-ebnlgrPUxF0x (2024-10-29)
- dap-dev-deploy-role (2025-09-30)
- dap-lambda-athena-processing-role-demo (2023-05-18)
- dap-RedshiftAccessEC2SchedulingLambdaRole-1E93IVOFM5EDE (2023-07-31)
- dap-statemachine-athena-processing-role-demo (2023-05-18)
- dap-txma-reconciliation-role-fzfc59wz (2023-06-13)
- dap2-AthenaGetConfigLambdaRole-1r7OXi3W25lj (2025-05-26)
- dap2-AthenaGetConfigLambdaRole-EChrqhwazyCu (2025-05-27)
- dap2-AthenaGetStatementLambdaRole-ds2pOE7jYHYm (2025-05-26)
- dap2-AthenaGetStatementLambdaRole-rfiFJE5AkTJ3 (2025-05-27)
- dap2-S3RawToStagingLambdaRole-4slCUSLhLs8N (2025-05-27)
- dap2-S3RawToStagingLambdaRole-yDPfBQpIdfxl (2025-05-26)
- dap2-S3SendMetadataLambdaRole-20iQAIY4uy0n (2025-05-26)
- dap2-S3SendMetadataLambdaRole-ztbFuYQLOYQ4 (2025-05-27)
- demo-dap-glue-scripts-execution-role (2025-09-10)
- PL-dap-dev-deploy-quicksight-access-DeployRole-0a6f4770887a (2023-11-07)
- PL-dap-dev-deploy-quicksight-access-DepTrigRole-0a6f4770887a (2023-11-07)
- richa-dap-sustainability-1-SustainabilityBucketRole-Zbu4Hsn7VLUW (2024-11-11)
- s3crr_role_for_dev-richa-dap-sustainability-1 (2024-11-07)
- s3crr_role_for_dev-richa-dap-sustainability-1_1 (2024-11-07)
- StepFunctions-dap-txma-athena-processing-role-a689fbf8 (2023-05-17)
- StepFunctions-unit-testing-dev-dap-raw-to-stage-role-d6c6a41e (2023-06-23)

## VPC Endpoints (22)

- vpce-0f7a11f4e1d2a926e (s3)
- vpce-089361477ae50da96 (vpce-svc-0e50ca0dec178147d)
- vpce-01e0cd118c70b2c34 (vpce-svc-00c96c04c1769625f)
- vpce-03be8528e453a62ed (vpce-svc-0ccefdc47bdf7b36c)
- vpce-0a54e861ef0f66173 (lambda)
- vpce-055a3fe9772284067 (s3)
- vpce-07963610b3841efaf (sns)
- vpce-00b4063125db1a3f5 (s3)
- vpce-0a55279f753f811c9 (ssmmessages)
- vpce-08f19f249787b15cf (ssm)
- vpce-0d5f23fd68e4eff5d (ec2messages)
- vpce-0ccac8fa7c548b8d2 (events)
- vpce-027fb23546bf2af33 (kinesis-firehose)
- vpce-0effff6eb81648d7f (athena)
- vpce-048ef430ce1f70088 (redshift-data)
- vpce-0e8a55d32333e1b44 (states)
- vpce-02698741d4bb30b9c (secretsmanager)
- vpce-0c9abb8824c01661d (sqs)
- vpce-0d11ef87e13e8d51d (logs)
- vpce-082a08ca85cfbeeb6 (redshift-serverless)
- vpce-07a01561c146433b2 (lambda)
- vpce-0ef6239e1f8931346 (vpce-svc-03348d3718e88f31a)

Note: IaC defines 14 VPC endpoints. There are duplicates (3x s3, 2x lambda) and 4 private service endpoints (vpce-svc-*) that may be platform-managed (Dynatrace etc).

## Kinesis Firehose (0)

None.

## EventBridge Rules (24)

- AWSControlTowerManagedRule
- AwsBackupManagedRule-5
- DO-NOT-DELETE-AmazonInspectorEc2ManagedRule
- DO-NOT-DELETE-AmazonInspectorEc2TagManagedRule
- DO-NOT-DELETE-AmazonInspectorEcrManagedRule
- DO-NOT-DELETE-AmazonInspectorLambdaCodeManagedRule
- DO-NOT-DELETE-AmazonInspectorLambdaManagedRule
- DO-NOT-DELETE-AmazonInspectorLambdaTagManagedRule
- Root-Console-Sign-In-CloudTrail-Root-Activity-Rule
- SnapshotScheduleRule
- StepFunctionsGetEventsForStepFunctionsExecutionRule
- TestRule
- aws-controltower-ConfigComplianceChangeEventRule
- backup-monitoring-BackupFrequency-TagChangeOnResource
- backup-vault-monitoring-BackupEventsStateChangeRule
- backup-vault-monitoring-BackupEventsStatusChangeRule
- dap-ReferenceDataIngestionAlertingEventRule-WGDISNULWw0J
- dap-StatemachineFailuerEventRule-HvhSkloAiQPT
- dap-TxmaRawLayerConsolidatedSchemaProcessingStateMa-USjy1gmP7tAz
- dap-dev-deploy-quicksight-DeploymentTriggerCloudWat-Px1Tu3peYGsO
- demo-pipeline-DeploymentTriggerCloudWatchEventRule-4bwivvgWwkjQ
- schema-validation-log-creation
- secure-pipelines-pipeline-DeploymentTriggerCloudWa-M6FXNLVYEE8B
- sustainability-pipeline-DeploymentTriggerCloudWatch-AGOMTh7NkQbS

Note: DO-NOT-DELETE-*, AWSControlTower*, backup-* are AWS/platform managed — do NOT delete. The dap-* rules with CFN suffixes are likely from the active stack.

## Failed CloudFormation Stacks (2)

- unit-testing-helpers (ROLLBACK_COMPLETE)
- DAPLambdaLogGroupSubscriptionFilterStack (ROLLBACK_COMPLETE)
