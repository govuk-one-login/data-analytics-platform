# Dangling Resources Review

Review date: 2026-06-01

## Active Pipeline Flow

```
TxMA SQS Queue (external, or placeholder in dev/build)
        │
        ▼ [SQS EventSourceMapping]
EventConsumerLambda (txma-event-consumer)
        │
        ▼ [PutRecord/PutRecordBatch]
KinesisFirehose → RawLayerBucket (s3://{env}-dap-raw-layer/txma-refactored/)
        │
        ▼ [Daily cron: 01:20 UTC — or HypercareRule when enabled]
TxmaRawLayerConsolidatedSchemaProcessingStateMachine
        │
        ├─► RawStageTransformProcessPythonGlueJob
        │     reads: RawLayerBucket, ELTMetadataBucket
        │     writes: StageLayerBucket
        │
        ├─► DataQualityStageLayerOptimisedPythonGlueJob
        │     reads: StageLayerBucket, ELTMetadataBucket
        │     writes: DataQualityMetricsBucket
        │
        └─► RedshiftConsolidatedModelProcessingStateMachine
                │
                ├─► Redshift SPs (parallel): dim_event, dim_user_journey_event,
                │   dim_user_refactored, dim_journey_channel, dim_relying_party
                ├─► fact_user_journey_event_refactored_upsert()
                ├─► event_extensions_refactored_upsert()
                ├─► update_event_batch_table()
                │
                └─► [ADM environments only]
                    ADMConsolidatedModelProcessingStateMachine
                        ├─► refresh_adm_views_cascade_part_a/b [production only]
                        └─► ADMV3RefreshStateMachine
                              └─► sp_run_adm_pipeline()
```

TODO: Check with Data analytics team to see if this is still needed?

**Reference Data Pipeline:**
```
CSV upload to RawLayerBucket/reference-data/
        ▼ [S3 notification]
S3RawToStagingLambda → StageLayerBucket/reference-data/
        ▼ [S3 notification]
S3SendMetadataLambda → ReferenceDataSQSQueue (FIFO)
        ▼ [EventBridge Pipe]
ProcessReferenceDataStateMachine
        ├─► StepFunctionValidationLambda
        ├─► RedshiftGetMetadataLambda
        └─► ReferenceDataRedshiftIngestionGlueJob → Redshift
```

## Resources Wired into the Pipeline

### State Machines (with triggers)

| State Machine | Trigger |
|---|---|
| TxmaRawLayerConsolidatedSchemaProcessingStateMachine | Daily cron (01:20 UTC) + HypercareAdjustedScheduleEventBridgeRule (DISABLED by default) |
| RedshiftConsolidatedModelProcessingStateMachine | Invoked by TxmaRawLayerConsolidatedSchemaProcessingStateMachine |
| ADMConsolidatedModelProcessingStateMachine | Invoked by RedshiftConsolidatedModelProcessingStateMachine (ADM environments only) |
| ADMV3RefreshStateMachine | Invoked by ADMConsolidatedModelProcessingStateMachine |
| ProcessReferenceDataStateMachine | EventBridge Pipe from ReferenceDataSQSQueue |

### Lambdas (with triggers)

| Lambda | Trigger |
|---|---|
| EventConsumerLambda (txma-event-consumer) | SQS EventSourceMapping (TxMA queue) |
| S3RawToStagingLambda (s3-raw-to-staging) | S3 notification on RawLayerBucket (reference-data/*.csv) |
| S3SendMetadataLambda (s3-send-metadata) | S3 notification on StageLayerBucket (reference-data/*.csv) |
| RedshiftGetMetadataLambda (redshift-get-metadata) | ProcessReferenceDataStateMachine |
| StepFunctionValidationLambda (stepfunction-validate-execution) | ProcessReferenceDataStateMachine |
| DLQLambda (dlq-to-eventbridge) | SQS (DeadLetterQueue + LambdaDeadLetterQueue) |
| RedshiftCreateSnapshotLambda | EventBridge schedule (daily 22:00) |
| RedshiftSecretRotationLambda | SecretsManager rotation (monthly) |
| RedshiftErrorNotificationLambda | CloudWatch Logs subscription filter |
| S3NotificationsLoggerLambda | EventBridge rule (all S3 Object Created/Deleted events) |

### Glue Jobs (with triggers)

| Glue Job | Trigger |
|---|---|
| RawStageTransformProcessPythonGlueJob | TxmaRawLayerConsolidatedSchemaProcessingStateMachine |

### S3 Buckets (actively used)

| Bucket | Role |
|---|---|
| RawLayerBucket ({env}-dap-raw-layer) | Firehose writes TxMA events; reference data uploaded here |
| StageLayerBucket ({env}-dap-stage-layer) | Glue job writes stage data; reference data staged here |
| ELTMetadataBucket ({env}-dap-elt-metadata) | Config, scripts, Glue job source code |
| StateMachineResultsBucket ({env}-dap-step-function-process-results) | Distributed Map results from state machines |
| DataQualityMetricsBucket ({env}-dap-data-quality-metrics) | Data quality Glue job output |
| FlywayFilesBucket ({env}-dap-flyway-files) | Flyway migration scripts for Redshift |
| GlueJobResultsBucket ({env}-dap-glue-job-process-results) | Reference data Glue job temp/results |
| GlobalLogBucket ({env}-dap-s3-logs) | Central S3 access logging for all buckets |
| VPCFlowLogsBucket ({env}-dap-vpc-flow-logs) | VPC flow log storage |

## Dangling / Potentially Unused Resources

| Resource | Type | Why it's dangling |
|---|---|---|
| `athena_raw_layer_processing.asl.json` | State machine definition file | No IaC resource deploys it. Old pre-consolidated pipeline. |
| `RedshiftProcessingStateMachine` (`redshift_elt_processing.asl.json`) | Deployed state machine | No trigger, no parent invokes it. Old non-refactored Redshift ELT using `conformed.sp_setup_conformed_schema()`. Superseded by `RedshiftConsolidatedModelProcessingStateMachine`. |
| `AthenaGetConfigLambda` (athena-get-config) | Deployed lambda | Only referenced by the old undeployed `athena_raw_layer_processing` state machine. No active workflow invokes it. |
| `AthenaGetStatementLambda` (athena-get-statement) | Deployed lambda | Same as above — only used by the old pipeline. |
| `DataQualityPythonGlueJob` ({env}-dap-data-quality-metrics-generation) | Deployed Glue job | Not referenced by any state machine or trigger. Old data quality job superseded by `DataQualityStageLayerOptimisedPythonGlueJob`. |
| `SplunkMigratedRawStageTransformProcessPythonGlueJob` | Deployed Glue job | Not referenced by any state machine or trigger. One-off migration job. |
| `SplunkRawLayerSingleTableCrawler` | Deployed Glue crawler | No schedule, rule, or state machine triggers it. |
| `GlobalNonEventBucket` ({env}-dap-s3-non-event) | S3 Bucket | Not referenced by any lambda, state machine, Glue job, or Redshift schema. Nothing writes to or reads from it in IaC or source code. |
| StepFunctionRole permission for `{env}-dap-raw-to-stage-process` | IAM permission | References a state machine that doesn't exist in IaC — leftover from old pipeline. |
| DataQualityStageLayerOptimisedPythonGlueJob | TxmaRawLayerConsolidatedSchemaProcessingStateMachine | todo |
| ReferenceDataRedshiftIngestionGlueJob | ProcessReferenceDataStateMachine | todo |

### Intentionally manual (not dangling)

| Resource | Purpose |
|---|---|
| RunFlywayCommandLambda | Invoked by GitHub Action for Redshift migrations |
| TestSupportLambda | Invoked by integration tests |

## Sustainability Section

**Resources:** `SustainabilityAccountIds` (secret), `SustainabilityDatabase` (Glue DB), `CurTable` (Glue table)

**Status:** Not dangling — actively used as a passive Redshift external schema.

The `CurTable` Glue table points to an external S3 bucket in the SRE shared-services account containing AWS Cost and Usage Reports (CUR) as parquet. Redshift creates an external schema called `sustainability` via `CREATE EXTERNAL SCHEMA ... FROM DATA CATALOG DATABASE '{env}-sustainability'` (set up via Redshift setup scripts). The `IAMRoleRedshiftServerless` has S3 read access to the CUR bucket in ADM environments. The `sustainability` schema is included in Flyway's managed schemas.

**Trigger:** None — this is passive infrastructure. Redshift queries the CUR data on-demand via the external schema for QuickSight dashboards and ad-hoc queries. Only deployed in ADM environments (staging + production).
