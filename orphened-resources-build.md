==============================================
AWS Orphaned Resource Audit
Profile:     dap-build
Region:      eu-west-2
Environment: build
Date:        2026-05-20T16:50:05Z
==============================================

>>> Collecting CloudFormation-managed resources...
Found 0 resources across 58 stacks

==============================================
ORPHANED RESOURCES (not in IaC or any CloudFormation stack)
==============================================

--- S3 Buckets ---
ORPHAN: aws-athena-query-results-991664831801-eu-west-2
ORPHAN: cdk-accel-assets-991664831801-eu-west-2
ORPHAN: cf-templates-18omelenx5x03-eu-west-2
ORPHAN: dap-build-deploy-artifactpromotionbucket-19j80jcfq6q4v
ORPHAN: dap-build-deploy-core-artifactpromotionbucket-fxutbocfoweq
ORPHAN: dap-build-deploy-core-githubartifactsourcebucket-zvt8vdrbelma
ORPHAN: dap-build-deploy-core-pipelinebucket-ze2kdcwj1kyl
ORPHAN: dap-build-deploy-core-s3logs-0a9c6218fc95
ORPHAN: dap-build-deploy-githubartifactsourcebucket-1sf5xgjl7nzp6
ORPHAN: dap-build-deploy-githubartifactsourcebucket-test
ORPHAN: dap-build-deploy-pipelinebucket-vyk2fb70vhmf
ORPHAN: dap-build-deploy-quicksi-githubartifactsourcebuck-46chinu76h2a
ORPHAN: dap-build-deploy-quicksig-artifactpromotionbucket-ryo6pr7frgal
ORPHAN: dap-build-deploy-quicksight-access-pipelinebucket-16ee8n0ecgqn4
ORPHAN: dap-build-deploy-quicksight-access-s3logs-02c0a7b25a22
ORPHAN: dap-build-deploy-s3logs-02569a5d3e58
ORPHAN: demo-dap-artifactpromotionbucket-hqfo4g5lwl3p
ORPHAN: demo-dap-githubartifactsourcebucket-qqlbqh8q9cui
ORPHAN: demo-dap-pipelinebucket-qszqpj05wpkx
ORPHAN: demo-dap-s3logs-06cf70d3790f
ORPHAN: di-lb-access-logs-991664831801-eu-west-2
ORPHAN: di-s3-access-logs-991664831801-eu-west-2
ORPHAN: testing-acls-991664831801

--- Lambda Functions ---
ORPHAN: aws-controltower-NotificationForwarder (runtime: python3.13, last modified: 2025-07-18T10:18:02.000+0000)

--- SQS Queues ---
ORPHAN: backup-vault-monitoring-EventBusRuleDLQ (messages: 0)
ORPHAN: placeholder-txma-event-queue (messages: 0)

--- Step Functions ---

--- Glue Databases ---

--- Glue Jobs ---
ORPHAN: build-dap-raw-stage-transform-process-demo

--- Glue Crawlers ---

--- Redshift Serverless ---

--- CloudWatch Log Groups ---
ORPHAN: /aws-glue/crawlers-role/build-raw-glue-crawler-role-build-dap-glue-security-configuration (0MB, retention: 30)
ORPHAN: /aws-glue/crawlers-role/build-stage-glue-crawler-role-build-dap-glue-security-configuration (0MB, retention: 30)
ORPHAN: /aws-glue/python-jobs/build-dap-glue-security-configuration-build-dap-glue-scripts-execution-role/error (.08MB, retention: 30)
ORPHAN: /aws-glue/python-jobs/build-dap-glue-security-configuration-build-dap-glue-scripts-execution-role/output (.87MB, retention: 30)
ORPHAN: /aws/apigateway/dap-quicksight-access-endpoint-access-logs (0MB, retention: 30)
ORPHAN: /aws/codebuild/Deploy-dap-build-deploy (1.25MB, retention: 30)
ORPHAN: /aws/codebuild/Deploy-dap-build-deploy-core (0MB, retention: 30)
ORPHAN: /aws/codebuild/Deploy-dap-build-deploy-quicksight-access (.25MB, retention: 30)
ORPHAN: /aws/codebuild/Deploy-demo-dap (0MB, retention: 30)
ORPHAN: /aws/codebuild/Promotion-dap-build-deploy (.29MB, retention: 30)
ORPHAN: /aws/codebuild/Promotion-dap-build-deploy-core (0MB, retention: 30)
ORPHAN: /aws/codebuild/Promotion-dap-build-deploy-quicksight-access (.34MB, retention: 30)
ORPHAN: /aws/codebuild/Promotion-demo-dap (0MB, retention: 30)
ORPHAN: /aws/codebuild/Test-dap-build-deploy (.28MB, retention: 30)
ORPHAN: /aws/codebuild/Test-dap-build-deploy-quicksight-access (.10MB, retention: 30)
ORPHAN: /aws/lambda/RTestFn (0MB, retention: 30)
ORPHAN: /aws/lambda/aws-controltower-NotificationForwarder (0MB, retention: 14)
ORPHAN: /aws/redshift/build-redshift-serverless-ns/useractivitylog (11.13MB, retention: 30)
ORPHAN: StackSet-AWSControlTowerBP-VPC-ACCOUNT-FACTORY-V1-bc76328a-71c1-427b-8c7e-2deb1a2d7e9d-VPCFlowLogsLogGroup-vokiOWDlGFFj (0MB, retention: 3653)
ORPHAN: gds-digitalidentity-audit-logs (.05MB, retention: 30)
ORPHAN: gds-digitalidentity-checkovhook-logs (0MB, retention: 30)
ORPHAN: gds-digitalidentity-infra-audit-logs (.52MB, retention: 30)
ORPHAN: gds-digitalidentity-infrastructure-audit-hook-logs (.61MB, retention: 30)
ORPHAN: gds-digitalidentity-lambda-audit-hook-logs (.14MB, retention: 30)

--- Secrets Manager Secrets ---
ORPHAN: sqlworkbench!075c6671-7353-4dc2-9ca2-73de3ed0cc01 (last accessed: 2023-07-26T01:00:00+01:00)
ORPHAN: sqlworkbench!fcdc911c-1cd4-47b1-988d-569cef2fe13c (last accessed: 2025-07-29T01:00:00+01:00)
ORPHAN: sqlworkbench!f105c024-a32a-4076-9ac2-03b81d18dfa1 (last accessed: 2025-07-31T01:00:00+01:00)
ORPHAN: RedshiftSecret-8w7yVAdXAShI (last accessed: 2026-05-20T01:00:00+01:00)

--- SSM Parameters ---
ORPHAN: /cdk-bootstrap/accel/version
ORPHAN: /inspector-aws/service/inspector-linux-application-paths
ORPHAN: /tests/dap/dapAthenaRawLayerDatabase
ORPHAN: /tests/dap/dapAthenaStageLayerDatabase
ORPHAN: /tests/dap/dapAthenaWorkgroup
ORPHAN: /tests/dap/dapRawLayerBucket
ORPHAN: /tests/dap/dapTXMAConsumerSQSQueueUrl
ORPHAN: /tests/dap/glueLogGroup
ORPHAN: /tests/dap/rawToStageStepFunction
ORPHAN: /tests/dap/redshiftSecretArn
ORPHAN: /tests/dap/redshiftWorkgroupName
ORPHAN: /tests/dap/stageToConformStepFunction

--- IAM Roles (dap/di-data related) ---
ORPHAN: dap-build-deploy-CodePipelineRole-QOR1CEHBOEMJ (created: 2023-06-02T09:26:50+00:00)
ORPHAN: dap-build-deploy-core-CodePipelineRole-4CgfNi3OMEFp (created: 2025-09-24T09:22:56+00:00)
ORPHAN: dap-build-deploy-core-GitHubActionsRole-wj8pAW8H0KH5 (created: 2025-09-24T09:23:37+00:00)
ORPHAN: dap-build-deploy-core-GitHubActionsValidateRole-8vrKHqqaq1Y7 (created: 2025-09-24T09:21:36+00:00)
ORPHAN: dap-build-deploy-GitHubActionsRole-18H77IS9DRAGO (created: 2023-06-02T09:27:17+00:00)
ORPHAN: dap-build-deploy-GitHubActionsValidateRole-1T76NEHBJMLRL (created: 2023-06-02T09:25:12+00:00)
ORPHAN: dap-build-deploy-quicksig-GitHubActionsValidateRole-4ms7P4YFdwAX (created: 2023-11-09T15:36:36+00:00)
ORPHAN: dap-build-deploy-quicksight-acces-GitHubActionsRole-wronnvgtSPU7 (created: 2023-11-09T15:38:39+00:00)
ORPHAN: dap-build-deploy-quicksight-access-CodePipelineRole-WCMeOkJFrWPp (created: 2023-11-09T15:38:29+00:00)
ORPHAN: dap-build-infrastructure-audit-ExecutionRole-1554J941NL27I (created: 2023-07-18T12:03:05+00:00)
ORPHAN: dap-build-infrastructure-LogAndMetricsDeliveryRol-1JBRGE7JJVRKV (created: 2023-07-18T12:00:48+00:00)
ORPHAN: dap-build-lambda-audit-ExecutionRole-Y0AFJR11CYR8 (created: 2023-07-18T11:55:10+00:00)
ORPHAN: dap-build-lambda-audit-LogAndMetricsDeliveryRole-1DC52DJLD1O5K (created: 2023-07-18T11:53:00+00:00)
ORPHAN: dap-build-slack-notifications-ChatbotRole-AM29U3E30S5D (created: 2023-07-11T15:52:18+00:00)
ORPHAN: demo-dap-CodePipelineRole-zBUtkrVOKVbD (created: 2025-09-11T13:59:33+00:00)
ORPHAN: demo-dap-GitHubActionsRole-Mspy8pAsZezj (created: 2025-09-11T14:00:17+00:00)
ORPHAN: demo-dap-GitHubActionsValidateRole-xop8oJ0UVSeN (created: 2025-09-11T13:58:09+00:00)
ORPHAN: PL-dap-build-deploy-core-DeployRole-0a9c6218fc95 (created: 2025-09-24T09:22:13+00:00)
ORPHAN: PL-dap-build-deploy-core-DepTrigRole-0a9c6218fc95 (created: 2025-09-24T09:23:21+00:00)
ORPHAN: PL-dap-build-deploy-core-PromotionRole-0a9c6218fc95 (created: 2025-09-24T09:22:13+00:00)
ORPHAN: PL-dap-build-deploy-core-PromoTrigRole-0a9c6218fc95 (created: 2025-09-24T09:21:20+00:00)
ORPHAN: PL-dap-build-deploy-DeployRole-02569a5d3e58 (created: 2023-06-02T09:26:06+00:00)
ORPHAN: PL-dap-build-deploy-DepTrigRole-02569a5d3e58 (created: 2023-08-08T10:19:28+00:00)
ORPHAN: PL-dap-build-deploy-PromotionRole-02569a5d3e58 (created: 2023-06-02T09:26:05+00:00)
ORPHAN: PL-dap-build-deploy-PromoTrigRole-02569a5d3e58 (created: 2023-08-08T10:18:20+00:00)
ORPHAN: PL-dap-build-deploy-quicksight-access-DeployRole-02c0a7b25a22 (created: 2023-11-09T15:37:33+00:00)
ORPHAN: PL-dap-build-deploy-quicksight-access-DepTrigRole-02c0a7b25a22 (created: 2023-11-09T15:38:58+00:00)
ORPHAN: PL-dap-build-deploy-quicksight-access-PromotionRole-02c0a7b25a22 (created: 2023-11-09T15:37:32+00:00)
ORPHAN: PL-dap-build-deploy-quicksight-access-PromoTrigRole-02c0a7b25a22 (created: 2023-11-09T15:36:14+00:00)
ORPHAN: PL-dap-build-deploy-quicksight-access-TestRole-02c0a7b25a22 (created: 2025-09-24T13:31:54+00:00)
ORPHAN: PL-dap-build-deploy-TestRole-02569a5d3e58 (created: 2023-08-15T13:30:24+00:00)
ORPHAN: PL-demo-dap-DeployRole-06cf70d3790f (created: 2025-09-11T13:58:47+00:00)
ORPHAN: PL-demo-dap-DepTrigRole-06cf70d3790f (created: 2025-09-11T13:59:59+00:00)
ORPHAN: PL-demo-dap-PromotionRole-06cf70d3790f (created: 2025-09-11T13:58:47+00:00)
ORPHAN: PL-demo-dap-PromoTrigRole-06cf70d3790f (created: 2025-09-11T13:57:51+00:00)

--- VPC Endpoints ---
ORPHAN: vpce-039cc7a9a1dcd4639 (com.amazonaws.eu-west-2.s3, state: available)
ORPHAN: vpce-0ab28b7bad7bc49a6 (com.amazonaws.eu-west-2.ssmmessages, state: available)
ORPHAN: vpce-04ab221b4d8528709 (com.amazonaws.eu-west-2.ssm, state: available)
ORPHAN: vpce-0d9481cf974039c85 (com.amazonaws.eu-west-2.secretsmanager, state: available)
ORPHAN: vpce-082ffdeebbc936cd3 (com.amazonaws.eu-west-2.redshift-serverless, state: available)
ORPHAN: vpce-0a6c34915cb81f2f8 (com.amazonaws.eu-west-2.states, state: available)
ORPHAN: vpce-00016a7b31a36011d (com.amazonaws.eu-west-2.kinesis-firehose, state: available)
ORPHAN: vpce-09adae5f1a3fa12fb (com.amazonaws.eu-west-2.ec2messages, state: available)
ORPHAN: vpce-05f84e97f00fd1381 (com.amazonaws.eu-west-2.lambda, state: available)
ORPHAN: vpce-0a90a92c4dca84500 (com.amazonaws.eu-west-2.redshift-data, state: available)
ORPHAN: vpce-033f38545dc548ea4 (com.amazonaws.eu-west-2.athena, state: available)
ORPHAN: vpce-00e1122c3a727834d (com.amazonaws.eu-west-2.sqs, state: available)
ORPHAN: vpce-0a0aa2046b9a52e09 (com.amazonaws.eu-west-2.events, state: available)
ORPHAN: vpce-050571aa492dfc22b (com.amazonaws.eu-west-2.s3, state: available)
ORPHAN: vpce-0d4bfea992858ee50 (com.amazonaws.eu-west-2.logs, state: available)
ORPHAN: vpce-0cba2e15198609697 (com.amazonaws.vpce.eu-west-2.vpce-svc-004fa7a7080e25f88, state: available)

--- Kinesis Firehose Delivery Streams ---

--- EventBridge Rules (default bus) ---
ORPHAN: AWSControlTowerManagedRule
ORPHAN: AwsBackupManagedRule-6
ORPHAN: DO-NOT-DELETE-AmazonInspectorEc2ManagedRule
ORPHAN: DO-NOT-DELETE-AmazonInspectorEc2TagManagedRule
ORPHAN: DO-NOT-DELETE-AmazonInspectorEcrManagedRule
ORPHAN: DO-NOT-DELETE-AmazonInspectorLambdaCodeManagedRule
ORPHAN: DO-NOT-DELETE-AmazonInspectorLambdaManagedRule
ORPHAN: DO-NOT-DELETE-AmazonInspectorLambdaTagManagedRule
ORPHAN: Root-Console-Sign-In-CloudTrail-Root-Activity-Rule
ORPHAN: StepFunctionsGetEventsForStepFunctionsExecutionRule
ORPHAN: aws-controltower-ConfigComplianceChangeEventRule
ORPHAN: awscodestarnotifications-rule
ORPHAN: backup-monitoring-BackupFrequency-TagChangeOnResource
ORPHAN: backup-vault-monitoring-BackupEventsStateChangeRule
ORPHAN: backup-vault-monitoring-BackupEventsStatusChangeRule
ORPHAN: dap-ReferenceDataIngestionAlertingEventRule-Hxl2au3K1ciz
ORPHAN: dap-StatemachineFailuerEventRule-7wH6lpMeB97C
ORPHAN: dap-TxmaRawLayerConsolidatedSchemaProcessingStateMa-DEZufsdbn6og
ORPHAN: dap-build-deploy-DeploymentTriggerCloudWatchEventR-17CFPFGK11EFG
ORPHAN: dap-build-deploy-PromotionTriggerCloudWatchEventRu-1SL9RUTFLJYO3
ORPHAN: dap-build-deploy-core-DeploymentTriggerCloudWatchEv-Bjkb6Yla0YSh
ORPHAN: dap-build-deploy-core-PromotionTriggerCloudWatchEve-ZmN6yrzucice
ORPHAN: dap-build-deploy-quicksig-DeploymentTriggerCloudWat-9xM1aOe7t9OF
ORPHAN: dap-build-deploy-quicksig-PromotionTriggerCloudWatc-iKdtISJy4MNh
ORPHAN: demo-dap-DeploymentTriggerCloudWatchEventRule-x8DpdsBfrJk4
ORPHAN: demo-dap-PromotionTriggerCloudWatchEventRule-8EWfzatSdouL

--- CloudFormation Stacks (failed/rollback states) ---

==============================================
Audit complete.
==============================================
