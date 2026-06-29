# IAC Main Resource Dependency Graph

Resource dependencies in `iac/main/` based on `!Ref` and `!GetAtt` usage.

## Dependency Graph by File

### global.yml

| Resource | Depends On |
|----------|-----------|
| GlobalLogBucketPolicy | GlobalLogBucket |
| GlobalNonEventBucket | GlobalLogBucket |
| GlobalNonEventBucketPolicy | GlobalNonEventBucket |
| VPCFlowLogsBucket | GlobalLogBucket |
| VPCFlowLogsBucketPolicy | VPCFlowLogsBucket |
| S3NotificationsLoggerLambda | LambdaSecurityGroup, SubnetForDAP1/2/3 |
| S3NotificationsLoggerEventBridgeRule | S3NotificationsLoggerLambda |
| S3BucketNotificationLambdaPermission | S3NotificationsLoggerLambda, S3NotificationsLoggerEventBridgeRule |
| GlueSecurityConfig | KmsKey |
| TestSupportLambda | KmsKey, RedshiftSecret, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| TestSupportLambdaTestingContainerPermission | TestSupportLambda |
| KmsKey | RawGlueCrawlerRole, StepFunctionRole, GlueScriptsExecutionRole, StepFunctionRedshiftProcessRole |
| KmsKeyAlias | KmsKey |
| FlowLogRole | VPCFlowLogsBucket |
| FlowLogs | VPCFlowLogsBucket, VPCForDAP |
| SubnetForDAP1/2/3 | VPCForDAP |
| RouteTableForDAP | VPCForDAP |
| SubnetRouteTableAssocDAP1/2/3 | RouteTableForDAP, SubnetForDAP1/2/3 |
| LambdaSecurityGroup | VPCForDAP |
| VPCEndpointAthena | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointCloudwatch | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointFirehose | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointLambda | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointRedshiftData | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointS3 | VPCForDAP, RouteTableForDAP |
| VPCEndpointSecretsManager | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointSQS | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointStepFunctions | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointRedshiftServerless | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VpcEndpointSecurityGroup | VPCForDAP |
| VPCEndpointSSM | VPCForDAP, SubnetForDAP1/2/3, VpcEndpointSecurityGroup |
| VPCEndpointSSMMessages | VPCForDAP, SubnetForDAP1/2/3, VpcEndpointSecurityGroup |
| VPCEndpointEC2Messages | VPCForDAP, SubnetForDAP1/2/3, VpcEndpointSecurityGroup |
| UnauthorizedApiCallLogGroup | KmsKey |
| IAMChangeLogGroup | KmsKey |
| CloudTrailCloudWatchLogsRole | UnauthorizedApiCallLogGroup, IAMChangeLogGroup |
| CloudTrailForUnauthorizedAPIChanges | TrailBucket, UnauthorizedApiCallLogGroup, CloudTrailCloudWatchLogsRole |
| CloudTrailForIAMChanges | TrailBucket, IAMChangeLogGroup, CloudTrailCloudWatchLogsRole |
| TrailBucket | GlobalLogBucket |
| TrailBucketPolicy | TrailBucket |
| UnauthorizedApiCallMetricFilter | UnauthorizedApiCallLogGroup |
| UnauthorizedApiCallAlarm | UnauthorizedApiCallSNSTopic |
| UnauthorizedApiCallSNSTopic | KmsKey |
| UnauthorizedApiCallSNSTopicSubscription | UnauthorizedApiCallSNSTopic |
| IAMChangeMetricFilter | IAMChangeLogGroup |
| IAMChangeAlarm | IAMChangeAlertSNSTopic |
| IAMChangeAlertSNSTopic | KmsKey |
| IAMChangeAlertSNSTopicSubscription | IAMChangeAlertSNSTopic |

### raw.yml

| Resource | Depends On |
|----------|-----------|
| RawLayerBucket | GlobalLogBucket, S3RawToStagingLambda |
| RawLayerBucketPolicy | RawLayerBucket |
| SplunkRawLayerSingleTableCrawler | RawGlueCrawlerRole, RawGlueDatabase, SplunkMigrationGlueTable, GlueSecurityConfig |
| SplunkMigrationGlueTable | RawGlueDatabase, RawLayerBucket |
| TxmaRefactoredTable | RawGlueDatabase, RawLayerBucket |

### stage.yml

| Resource | Depends On |
|----------|-----------|
| StageLayerBucket | GlobalLogBucket, S3SendMetadataLambda |
| StageLayerBucketPolicy | StageLayerBucket |

### athena.yml

| Resource | Depends On |
|----------|-----------|
| AthenaWorkgroupBucket | GlobalLogBucket |
| AthenaWorkgroupBucketPolicy | AthenaWorkgroupBucket |
| AthenaWorkGroup | AthenaWorkgroupBucket |
| AthenaGetConfigLambda | LambdaSecurityGroup, SubnetForDAP1/2/3 |
| AthenaGetStatementLambda | LambdaSecurityGroup, SubnetForDAP1/2/3 |
| AthenaWorkgroupName | AthenaWorkGroup |

### event.yml

| Resource | Depends On |
|----------|-----------|
| EventConsumerQueue | EventConsumerDlq, KmsKey |
| EventConsumerDlq | KmsKey |
| EventConsumerLambda | EventConsumerQueue, KinesisFirehose, KmsKey, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| EventConsumerEventSourceMapping | EventConsumerQueue, EventConsumerLambda |
| KinesisFirehose | RawLayerBucket, IAMRoleKinesisFirehose |
| IAMRoleKinesisFirehose | RawLayerBucket |
| EventConsumerQueueTestUrl | EventConsumerQueue |
| E2ETestProducerQueueKmsKeyAlias | E2ETestProducerQueueKmsKey |
| E2ETestProducerDeadLetterQueue | E2ETestProducerQueueKmsKey |
| E2ETestProducerQueue | E2ETestProducerQueueKmsKey, E2ETestProducerDeadLetterQueue |
| E2ETestProducerQueuePolicy | E2ETestProducerQueue |
| E2ETestProducerQueueUrlParameter | E2ETestProducerQueue |
| E2ETestProducerQueueArnParameter | E2ETestProducerQueue |
| E2ETestProducerQueueKmsKeyArnParameter | E2ETestProducerQueueKmsKey |

### state-machine.yml

| Resource | Depends On |
|----------|-----------|
| ELTMetadataBucket | GlobalLogBucket |
| ELTMetadataBucketPolicy | ELTMetadataBucket |
| StateMachineResultsBucket | GlobalLogBucket |
| StateMachineResultsBucketPolicy | StateMachineResultsBucket |
| AthenaRawLayerProcessingLogGroup | KmsKey |
| RedshiftProcessingLogGroup | KmsKey |
| RedshiftConsolidatedModelProcessingLogGroup | KmsKey |
| ADMConsolidatedModelProcessingLogGroup | KmsKey |
| ADMV3RefreshLogGroup | KmsKey |
| StepFunctionRole | AthenaGetConfigLambda, AthenaGetStatementLambda |
| DataQualityMetricsBucket | GlobalLogBucket |
| DataQualityMetricsBucketPolicy | DataQualityMetricsBucket |
| DataQualityMetricsGlueTable | DataQualityGlueDatabase, DataQualityMetricsBucket |
| DataQualityPythonGlueJob | ELTMetadataBucket, DataQualityGlueDatabase, DataQualityMetricsGlueTable, DataQualityMetricsBucket, GlueSecurityConfig, GlueScriptsExecutionRole |
| DataQualityStageLayerOptimisedPythonGlueJob | ELTMetadataBucket, DataQualityGlueDatabase, DataQualityMetricsGlueTable, DataQualityMetricsBucket, GlueSecurityConfig, GlueScriptsExecutionRole |
| RawStageTransformProcessPythonGlueJob | ELTMetadataBucket, StageLayerBucket, GlueSecurityConfig, GlueScriptsExecutionRole |
| SplunkMigratedRawStageTransformProcessPythonGlueJob | ELTMetadataBucket, StageLayerBucket, GlueSecurityConfig, GlueScriptsExecutionRole |
| RedshiftProcessingStateMachine | StepFunctionRedshiftProcessRole, RedshiftProcessingLogGroup, ELTMetadataBucket, RedshiftServerlessWorkgroup, StateMachineResultsBucket |
| RedshiftConsolidatedModelProcessingStateMachine | StepFunctionRedshiftProcessRole, RedshiftConsolidatedModelProcessingLogGroup, ELTMetadataBucket, RedshiftServerlessWorkgroup, StateMachineResultsBucket, ADMConsolidatedModelProcessingStateMachine |
| ADMConsolidatedModelProcessingStateMachine | StepFunctionRedshiftProcessRole, ADMConsolidatedModelProcessingLogGroup, ELTMetadataBucket, RedshiftServerlessWorkgroup, StateMachineResultsBucket, RedshiftSecret, ADMV3RefreshStateMachine |
| ADMV3RefreshStateMachine | StepFunctionRedshiftProcessRole, ADMV3RefreshLogGroup, ELTMetadataBucket, RedshiftServerlessWorkgroup, StateMachineResultsBucket, RedshiftSecret |
| TxmaRawLayerConsolidatedSchemaProcessingStateMachine | StepFunctionRole, AthenaRawLayerProcessingLogGroup, RawStageTransformProcessPythonGlueJob, DataQualityStageLayerOptimisedPythonGlueJob, RedshiftConsolidatedModelProcessingStateMachine |
| SNSAlertTopic | KmsKey |
| StatemachineFailuerEventRule | SNSAlertTopic |
| TopicRoutingPolicy | SNSAlertTopic |
| HypercareAdjustedScheduleEventBridgeRule | TxmaRawLayerConsolidatedSchemaProcessingStateMachine, HypercareAdjustedScheduleEventBridgeStateMachineInvokeRole |
| HypercareAdjustedScheduleEventBridgeStateMachineInvokeRole | TxmaRawLayerConsolidatedSchemaProcessingStateMachine |

### redshift.yml

| Resource | Depends On |
|----------|-----------|
| IAMRoleRedshiftServerless | RawLayerBucket, StageLayerBucket, ELTMetadataBucket, KmsKey |
| QuickSightEnvironmentPolicy | IAMRoleRedshiftServerless, DAPAnalystsFilesBucket |
| RedshiftSecret | KmsKey |
| RedshiftSecretRotationSchedule | RedshiftSecretRotationLambda, RedshiftSecret |
| RedshiftSecretRotationLambda | RedshiftSecret, KmsKey, LambdaSecurityGroup, RedshiftAccessEC2SecurityGroup, SubnetForDAP1/2/3 |
| RedshiftSecretRotationLambdaPermission | RedshiftSecretRotationLambda, RedshiftSecret |
| RedshiftServerlessNamespace | RedshiftSecret, IAMRoleRedshiftServerless, KmsKey |
| RedshiftServerlessWorkgroup | RedshiftServerlessNamespace, RedshiftSecret, SubnetForDAP1/2/3 |
| RedshiftAccessEC2SecurityGroup | VPCForDAP |
| VPCDefaultSecurityGroupRedshiftIngress | VPCForDAP, RedshiftAccessEC2SecurityGroup |
| VPCDefaultSecurityGroupEgressAll | VPCForDAP |
| VPCDefaultSecurityGroupAllIngress | VPCForDAP |
| RedshiftMigrationRole | RunFlywayCommandLambda |
| RunFlywayCommandLambda | RedshiftSecret, KmsKey, FlywayFilesBucket, LambdaSecurityGroup, RedshiftAccessEC2SecurityGroup, SubnetForDAP1/2/3 |
| FlywayFilesBucket | GlobalLogBucket |
| FlywayFilesBucketPolicy | FlywayFilesBucket |
| DataAnalyticsADMRedshiftRole | KmsKey, RedshiftServerlessWorkgroup, RedshiftSecret |
| RedshiftCreateSnapshotLambda | RedshiftServerlessNamespace, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| RedshiftCreateSnapshotScheduledRule | RedshiftCreateSnapshotLambda |
| RedshiftCreateSnapshotLambdaPermission | RedshiftCreateSnapshotLambda, RedshiftCreateSnapshotScheduledRule |
| RedshiftErrorNotificationLambda | KmsKey, DAPNotificationsTopic |
| RedshiftErrorSubscriptionFilter | RedshiftErrorNotificationLambda |
| RedshiftErrorLambdaInvokePermission | RedshiftErrorNotificationLambda |
| RedshiftSecretArnParameter | RedshiftSecret |
| RedshiftWorkgroupNameParameter | RedshiftServerlessWorkgroup |
| RedshiftErrorEventRule | DAPNotificationsTopic, RedshiftErrorDLQ |
| RedshiftErrorDLQ | KmsKey |
| RedshiftErrorDLQPolicy | RedshiftErrorDLQ, RedshiftErrorEventRule |

### manual-reference-data-ingestion.yml

| Resource | Depends On |
|----------|-----------|
| RedshiftGetMetadataLambda | ELTMetadataBucket, KmsKey, LambdaSecurityGroup, SubnetForDAP1/2/3, LambdaDeadLetterQueue |
| GlueJobResultsBucket | GlobalLogBucket |
| GlueJobResultsBucketPolicy | GlueJobResultsBucket |
| ReferenceDataSQSQueue | KmsKey, DeadLetterQueue |
| DeadLetterQueue | KmsKey |
| LambdaDeadLetterQueue | KmsKey |
| ProcessReferenceDataLogGroup | KmsKey |
| ProcessReferenceDataStateMachine | StepFunctionRole, ProcessReferenceDataLogGroup, ReferenceDataRedshiftIngestionGlueJob, RedshiftGetMetadataLambda |
| ReferenceDataProcessingPipeRole | ReferenceDataSQSQueue, ProcessReferenceDataStateMachine, KmsKey |
| ReferenceDataProcessingPipe | ReferenceDataProcessingPipeRole, ReferenceDataSQSQueue, ProcessReferenceDataStateMachine |
| GlueRedshiftConnection | RedshiftSecret, VPCForDAP, SubnetForDAP3 |
| ReferenceDataRedshiftIngestionGlueJob | ELTMetadataBucket, GlueJobResultsBucket, GlueRedshiftConnection, GlueSecurityConfig, GlueScriptsExecutionRole |
| S3SendMetadataLambda | ReferenceDataSQSQueue, KmsKey, LambdaSecurityGroup, SubnetForDAP1/2/3, LambdaDeadLetterQueue |
| S3SendMetadataLambdaPermission | S3SendMetadataLambda |
| S3RawToStagingLambda | ELTMetadataBucket, StageLayerBucket, KmsKey, LambdaSecurityGroup, SubnetForDAP1/2/3, LambdaDeadLetterQueue |
| S3RawToStagingLambdaPermission | S3RawToStagingLambda |
| ProcessReferenceDapAlertLogGroup | KmsKey |
| ReferenceDataIngestionAlertingEventRule | ProcessReferenceDapAlertLogGroup, SNSReferenceDataAlertTopic |
| ReferenceDataTopicRoutingPolicy | SNSReferenceDataAlertTopic |
| SNSReferenceDataAlertTopic | KmsKey |
| DLQLambda | DeadLetterQueue, LambdaDeadLetterQueue, KmsKey, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| VPCEndpointEventBridge | VPCForDAP, LambdaSecurityGroup, SubnetForDAP1/2/3 |
| StepFunctionValidationLambda | ProcessReferenceDataStateMachine, LambdaSecurityGroup, SubnetForDAP1/2/3 |

### slack.yml

| Resource | Depends On |
|----------|-----------|
| DAPNotificationsTopic | KmsKey |
| DAPNotificationsTopicSubscribePolicy | DAPNotificationsTopic |
| DAPNotificationsChatbotConfiguration | DAPNotificationChatbotRole, DAPNotificationsTopic |

### cdn.yaml

| Resource | Depends On |
|----------|-----------|
| DAPAnalystsFilesBucket | GlobalLogBucket |
| DAPAnalystsFilesBucketPolicy | DAPAnalystsFilesBucket, CloudFrontDistribution |
| CloudFrontDistribution | DAPAnalystsFilesBucket, OriginAccessControl |
| CloudFrontOAI | DAPAnalystsFilesBucket |

### step-function-alarms.yml

| Resource | Depends On |
|----------|-----------|
| TxmaStepFunctionFailureAlarm | TxmaRawLayerConsolidatedSchemaProcessingStateMachine, DAPNotificationsTopic |
| TxmaStepFunctionAbortedAlarm | TxmaRawLayerConsolidatedSchemaProcessingStateMachine, DAPNotificationsTopic |
| TxmaStepFunctionLongRunningAlarm | TxmaRawLayerConsolidatedSchemaProcessingStateMachine, DAPNotificationsTopic |
| RedshiftProcessingStepFunctionRetryingAlarm | RedshiftConsolidatedModelProcessingStateMachine, DAPNotificationsTopic |
| ADMProcessingStepFunctionRetryingAlarm | ADMConsolidatedModelProcessingStateMachine, DAPNotificationsTopic |

### txma-raw-to-stage-alarms.yml

| Resource | Depends On |
|----------|-----------|
| TXMAEventConsumerFunctionFirehoseErrorAlarm | DAPNotificationsTopic |
| TXMAEventConsumerFunctionValidationErrorAlarm | DAPNotificationsTopic |
| TXMAEventConsumerFunctionDurationAlarm | DAPNotificationsTopic |
| GlueStageLayerTableMissingAlarm | DAPNotificationsTopic |
| GlueRawLayerQueryErrorAlarm | DAPNotificationsTopic |
| GlueStageLayerInsertErrorAlarm | DAPNotificationsTopic |
| GlueReadConfigErrorAlarm | DAPNotificationsTopic |
| GlueWriteToS3ErrorAlarm | DAPNotificationsTopic |
| GlueReadFileFromS3ErrorAlarm | DAPNotificationsTopic |
| GlueStageLayerGenericInsertErrorAlarm | DAPNotificationsTopic |
| GenericValueExceptionErrorAlarm | DAPNotificationsTopic |
| GenericExceptionErrorAlarm | DAPNotificationsTopic |

### sustainability.yml

| Resource | Depends On |
|----------|-----------|
| CurTable | SustainabilityDatabase |

### pipeline.yml

All resources in this file are standalone IAM policies with no `!Ref` dependencies to other stack resources.

---

## Key Root Resources (most depended upon)

1. **VPCForDAP** — all networking (subnets, endpoints, security groups)
2. **KmsKey** — encryption for nearly every service (queues, secrets, log groups, buckets)
3. **GlobalLogBucket** — access logging for all S3 buckets
4. **LambdaSecurityGroup** — all lambdas and VPC endpoints
5. **SubnetForDAP1/2/3** — all lambdas, endpoints, and Redshift
6. **ELTMetadataBucket** — state machines, Glue jobs, lambdas
7. **DAPNotificationsTopic** — all alarms and error notifications
8. **RedshiftSecret** — Redshift workgroup, rotation, flyway, state machines
9. **GlueSecurityConfig** — all Glue jobs and crawlers
10. **GlueScriptsExecutionRole** — all Glue jobs

---

## Notable Cross-File Dependencies

- `event.yml` → `raw.yml` (KinesisFirehose → RawLayerBucket)
- `raw.yml` → `manual-reference-data-ingestion.yml` (RawLayerBucket → S3RawToStagingLambda)
- `stage.yml` → `manual-reference-data-ingestion.yml` (StageLayerBucket → S3SendMetadataLambda)
- `state-machine.yml` → `athena.yml` (StepFunctionRole → AthenaGetConfigLambda/AthenaGetStatementLambda)
- `state-machine.yml` → `redshift.yml` (state machines → RedshiftServerlessWorkgroup, RedshiftSecret)
- `state-machine.yml` → `stage.yml` (Glue jobs → StageLayerBucket)
- `redshift.yml` → `raw.yml`, `stage.yml`, `state-machine.yml` (IAMRoleRedshiftServerless → multiple buckets)
- `redshift.yml` → `cdn.yaml` (QuickSightEnvironmentPolicy → DAPAnalystsFilesBucket)
- `redshift.yml` → `slack.yml` (error notifications → DAPNotificationsTopic)
- `step-function-alarms.yml` → `state-machine.yml` + `slack.yml`
- `txma-raw-to-stage-alarms.yml` → `slack.yml` (all alarms → DAPNotificationsTopic)

---

## State Machine Invocation Chain

```
TxmaRawLayerConsolidatedSchemaProcessingStateMachine
  → RedshiftConsolidatedModelProcessingStateMachine
    → ADMConsolidatedModelProcessingStateMachine
      → ADMV3RefreshStateMachine
```

---

## Standalone Resources (no outgoing references)

- GlobalLogBucket (global.yml)
- VPCForDAP (global.yml)
- AWSSupportReadOnlyRole (global.yml)
- ELTMetadataUploadRole (state-machine.yml)
- StepFunctionRedshiftProcessRole (state-machine.yml)
- GlueScriptsExecutionRole (state-machine.yml)
- DataQualityGlueDatabase (state-machine.yml)
- TxmaRawConsolidatedSchemaToStageProcessStateMachineArnParameter (state-machine.yml)
- StageToConformStepFunctionParameter (state-machine.yml)
- GlueLogGroupParameter (state-machine.yml)
- SustainabilityAccountIds (sustainability.yml)
- SustainabilityDatabase (sustainability.yml)
- RawGlueCrawlerRole (raw.yml)
- RawGlueDatabase (raw.yml)
- SplunkPerformanceIndexSecret (raw.yml)
- RawLayerBucketName (raw.yml)
- ManualReferenceDataUploadRole (manual-reference-data-ingestion.yml)
- StageGlueDatabase (stage.yml)
- AthenaRawLayerDatabaseName (athena.yml)
- AthenaStageLayerDatabaseName (athena.yml)
- DeployRoleExtraIAMActions (pipeline.yml)
- GluePolicy (pipeline.yml)
- RedShiftEC2Policy (pipeline.yml)
- StateMachinePolicy (pipeline.yml)
- CloudTrailPolicy (pipeline.yml)
- CDNPolicy (pipeline.yml)
- IntegrationTestRolePolicy (pipeline.yml)
- E2ETestProducerQueueKmsKey (event.yml)
- E2ETestObfuscationHmacSecretArnParameter (event.yml)
- FlywayFilesBucketUploadRole (redshift.yml)
- DAPNotificationChatbotRole (slack.yml)
- OriginAccessControl (cdn.yaml)

---

## Redeployment Risk Analysis (Post-Deletion with Retained Resources)

After stack deletion, 90 resources have `DeletionPolicy: Retain` and will continue to exist in AWS. Redeploying the stack requires importing these resources back before CloudFormation can manage them again.

### Retained Resources by File

| File | Retained Resources |
|------|-------------------|
| global.yml | GlobalLogBucket, GlobalNonEventBucket, VPCFlowLogsBucket, S3NotificationsLoggerEventBridgeRule, KmsKey, VPCForDAP, FlowLogRole, SubnetForDAP1, SubnetForDAP2, SubnetForDAP3, RouteTableForDAP, LambdaSecurityGroup, VpcEndpointSecurityGroup, AWSSupportReadOnlyRole, TrailBucket, CloudTrailForUnauthorizedAPIChanges, UnauthorizedApiCallLogGroup, UnauthorizedApiCallAlarm, CloudTrailCloudWatchLogsRole, IAMChangeLogGroup, CloudTrailForIAMChanges, IAMChangeAlarm, IAMChangeAlertSNSTopic, UnauthorizedApiCallSNSTopic |
| state-machine.yml | ELTMetadataBucket, ELTMetadataUploadRole, ELTMetadataBucketPolicy, StateMachineResultsBucket, AthenaRawLayerProcessingLogGroup, StepFunctionRole, DataQualityMetricsBucket, DataQualityGlueDatabase, DataQualityPythonGlueJob, GlueScriptsExecutionRole, RedshiftProcessingLogGroup, StepFunctionRedshiftProcessRole, RawStageTransformProcessPythonGlueJob, SNSAlertTopic, DataQualityStageLayerOptimisedPythonGlueJob, RedshiftConsolidatedModelProcessingLogGroup, ADMConsolidatedModelProcessingLogGroup, ADMV3RefreshLogGroup, SplunkMigratedRawStageTransformProcessPythonGlueJob, HypercareAdjustedScheduleEventBridgeRule, HypercareAdjustedScheduleEventBridgeStateMachineInvokeRole |
| redshift.yml | IAMRoleRedshiftServerless, RedshiftSecret, RedshiftServerlessNamespace, RedshiftServerlessWorkgroup, RedshiftAccessEC2SecurityGroup, RedshiftMigrationRole, FlywayFilesBucket, FlywayFilesBucketUploadRole, DataAnalyticsADMRedshiftRole, RedshiftCreateSnapshotScheduledRule, RedshiftErrorEventRule, RedshiftErrorDLQ |
| manual-reference-data-ingestion.yml | GlueJobResultsBucket, ReferenceDataSQSQueue, DeadLetterQueue, LambdaDeadLetterQueue, ProcessReferenceDataLogGroup, ReferenceDataProcessingPipeRole, ReferenceDataRedshiftIngestionGlueJob, ManualReferenceDataUploadRole, ProcessReferenceDapAlertLogGroup, SNSReferenceDataAlertTopic |
| event.yml | EventConsumerQueue, EventConsumerDlq, KinesisFirehose, IAMRoleKinesisFirehose, E2ETestProducerQueueKmsKey, E2ETestProducerDeadLetterQueue, E2ETestProducerQueue |
| raw.yml | RawLayerBucket, RawLayerBucketPolicy, RawGlueCrawlerRole, RawGlueDatabase, SplunkPerformanceIndexSecret |
| stage.yml | StageLayerBucket, StageLayerBucketPolicy, StageGlueDatabase |
| athena.yml | AthenaWorkgroupBucket, AthenaWorkgroupBucketPolicy, AthenaWorkGroup |
| slack.yml | DAPNotificationsTopic, DAPNotificationChatbotRole |
| sustainability.yml | SustainabilityAccountIds, SustainabilityDatabase |
| cdn.yaml | DAPAnalystsFilesBucket |

### Key Risks

#### 1. Dangling Notification Configs on Retained Buckets

After deletion, these retained buckets will have S3 notification configurations pointing to deleted lambdas:

| Retained Bucket | References (deleted) | Impact |
|-----------------|---------------------|--------|
| RawLayerBucket | S3RawToStagingLambda | Bucket notification config points to non-existent lambda — S3 will log errors on matching object events until the lambda is recreated |
| StageLayerBucket | S3SendMetadataLambda | Same issue — dangling notification config |

#### 2. Import Ordering Constraint

CloudFormation requires all retained resources to be imported in a single changeset. The import template must be self-consistent — all `!Ref` and `!GetAtt` targets must either be part of the import set or resolve to parameters/pseudo-parameters.

Critical dependency chain for import validity:

```
KmsKey (retained)
  → references in key policy:
    → RawGlueCrawlerRole (retained ✓)
    → StepFunctionRole (retained ✓)
    → GlueScriptsExecutionRole (retained ✓)
    → StepFunctionRedshiftProcessRole (retained ✓)
```

All four roles referenced by KmsKey are also retained, so the import set is self-consistent for this critical resource.

#### 3. Retained Resources Referencing Other Retained Resources

These dependency chains are safe for import because both ends are retained:

| Resource | Depends On | Status |
|----------|-----------|--------|
| RedshiftServerlessWorkgroup | RedshiftServerlessNamespace, RedshiftSecret, SubnetForDAP1/2/3 | All retained ✓ |
| RedshiftServerlessNamespace | RedshiftSecret, IAMRoleRedshiftServerless, KmsKey | All retained ✓ |
| CloudTrailForUnauthorizedAPIChanges | TrailBucket, UnauthorizedApiCallLogGroup, CloudTrailCloudWatchLogsRole | All retained ✓ |
| CloudTrailForIAMChanges | TrailBucket, IAMChangeLogGroup, CloudTrailCloudWatchLogsRole | All retained ✓ |
| ELTMetadataBucketPolicy | ELTMetadataBucket | Retained ✓ |
| RawLayerBucketPolicy | RawLayerBucket | Retained ✓ |
| StageLayerBucketPolicy | StageLayerBucket | Retained ✓ |

#### 4. Retained Resources Referencing Non-Retained Resources

These are problematic during import — the template must either omit these references or use parameter placeholders:

| Retained Resource | References (not retained) | Issue |
|-------------------|--------------------------|-------|
| HypercareAdjustedScheduleEventBridgeRule | TxmaRawLayerConsolidatedSchemaProcessingStateMachine (not retained) | Import template must handle missing state machine reference |
| HypercareAdjustedScheduleEventBridgeStateMachineInvokeRole | TxmaRawLayerConsolidatedSchemaProcessingStateMachine (not retained) | Same issue |
| ReferenceDataProcessingPipeRole | ProcessReferenceDataStateMachine (not retained) | Role references non-retained state machine ARN |
| DataQualityPythonGlueJob | DataQualityMetricsGlueTable (not retained), GlueSecurityConfig (not retained) | Glue job config references deleted resources |
| DataQualityStageLayerOptimisedPythonGlueJob | DataQualityMetricsGlueTable (not retained), GlueSecurityConfig (not retained) | Same issue |
| RawStageTransformProcessPythonGlueJob | StageLayerBucket (retained ✓), GlueSecurityConfig (not retained) | Partial — GlueSecurityConfig not retained |
| SplunkMigratedRawStageTransformProcessPythonGlueJob | StageLayerBucket (retained ✓), GlueSecurityConfig (not retained) | Same issue |
| ReferenceDataRedshiftIngestionGlueJob | GlueRedshiftConnection (not retained), GlueSecurityConfig (not retained) | Both dependencies deleted |
| RedshiftCreateSnapshotScheduledRule | RedshiftCreateSnapshotLambda (not retained) | Rule target lambda is deleted |
| RedshiftErrorEventRule | DAPNotificationsTopic (retained ✓), RedshiftErrorDLQ (retained ✓) | OK |
| StepFunctionRole | AthenaGetConfigLambda (not retained), AthenaGetStatementLambda (not retained) | Role policy references deleted lambda ARNs |

#### 5. The CDN Circular Dependency

```
DAPAnalystsFilesBucket (retained)
  ↔ CloudFrontDistribution (NOT retained)
  ↔ DAPAnalystsFilesBucketPolicy (NOT retained)
```

After deletion:
- `DAPAnalystsFilesBucket` persists in AWS
- `CloudFrontDistribution` is deleted
- On redeploy, the bucket is imported, then CloudFormation creates the distribution and bucket policy — this works because the circular dependency only exists at the policy level (a separate resource), not a creation-blocking dependency

This is **not** a problem for redeployment.

### Recovery Process

The project includes `recover-stack.sh` and `generate-import-resources.ts` scripts to handle this scenario. The process is:

1. Build the CloudFormation template (`npm run iac:build -- main`)
2. Generate the retained resources JSON (`generate-import-resources.ts`)
3. Create a CloudFormation changeset with `--change-set-type IMPORT`
4. Execute the changeset to bring retained resources back under stack management
5. Deploy normally to create all non-retained resources

### Recommendations

1. **GlueSecurityConfig should be retained** — it is referenced by 5 retained Glue jobs but is not itself retained, creating an import inconsistency
2. **DataQualityMetricsGlueTable should be retained** — referenced by 2 retained Glue jobs
3. **Monitor that all KmsKey policy principals remain retained** — if any of the 4 roles lose their retention policy, the import will break
4. **The dangling S3 notification configs** on RawLayerBucket and StageLayerBucket should be expected after recovery — they will self-resolve once the lambdas are recreated in the subsequent deployment
