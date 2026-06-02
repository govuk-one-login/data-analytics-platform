# DAP Architecture & Pipeline Context

## Overview

GOV.UK One Login Data and Analytics Platform — serverless data pipeline processing TxMA audit events through raw → stage → conform layers into Redshift for QuickSight reporting.

- **Runtime:** Node 24, TypeScript, ES modules
- **IaC:** AWS SAM (2 apps: `main` + `quicksight-access`), deployed via Secure Pipelines
- **Region:** eu-west-2
- **Stack name:** di-data-dap
- **Environments:** dev, build, staging, integration, production, production-preview

## Active Pipeline

```
TxMA SQS → EventConsumerLambda → Firehose → RawLayerBucket
    ▼ [Daily cron 01:20 UTC]
TxmaRawLayerConsolidatedSchemaProcessingStateMachine
    ├─► RawStageTransformProcessPythonGlueJob (raw → stage)
    ├─► DataQualityStageLayerOptimisedPythonGlueJob
    └─► RedshiftConsolidatedModelProcessingStateMachine
            ├─► dim/fact upsert SPs (parallel)
            └─► [ADM envs] ADMConsolidatedModelProcessingStateMachine
                    └─► ADMV3RefreshStateMachine → sp_run_adm_pipeline()
```

**Reference Data Pipeline:**
```
CSV → RawLayerBucket/reference-data/ → S3RawToStagingLambda → StageLayerBucket
    → S3SendMetadataLambda → ReferenceDataSQSQueue (FIFO)
    → [EventBridge Pipe] → ProcessReferenceDataStateMachine → Redshift
```

## Key S3 Buckets

| Bucket | Purpose |
|--------|---------|
| `{env}-dap-raw-layer` | Firehose writes TxMA events; reference data uploaded here |
| `{env}-dap-stage-layer` | Glue job output; reference data staged here |
| `{env}-dap-elt-metadata` | Config, scripts, Glue job source code |
| `{env}-dap-step-function-process-results` | Distributed Map results |
| `{env}-dap-data-quality-metrics` | Data quality output |
| `{env}-dap-flyway-files` | Flyway migration scripts |
| `{env}-dap-glue-job-process-results` | Reference data Glue temp |

## State Machines (7 definitions, 5 active)

| State Machine | Trigger | Status |
|---|---|---|
| TxmaRawLayerConsolidatedSchemaProcessingStateMachine | Daily cron + Hypercare rule | ACTIVE |
| RedshiftConsolidatedModelProcessingStateMachine | Parent state machine | ACTIVE |
| ADMConsolidatedModelProcessingStateMachine | Parent (ADM envs only) | ACTIVE |
| ADMV3RefreshStateMachine | Parent (ADM envs only) | ACTIVE |
| ProcessReferenceDataStateMachine | EventBridge Pipe from SQS | ACTIVE |
| RedshiftProcessingStateMachine (`redshift_elt_processing.asl.json`) | Nothing | DANGLING — old non-refactored ELT |
| `athena_raw_layer_processing.asl.json` | Not deployed | DANGLING — no IaC resource |

## Dangling Resources (deployed but unused)

These are in IaC but have no trigger or active reference:

- `AthenaGetConfigLambda` — only used by old undeployed state machine
- `AthenaGetStatementLambda` — same
- `RedshiftProcessingStateMachine` — old ELT, superseded
- `DataQualityPythonGlueJob` — old data quality job, superseded
- `SplunkMigratedRawStageTransformProcessPythonGlueJob` — one-off migration
- `SplunkRawLayerSingleTableCrawler` — no trigger
- `GlobalNonEventBucket` (`{env}-dap-s3-non-event`) — nothing reads/writes it
- StepFunctionRole permission for `{env}-dap-raw-to-stage-process` — references non-existent state machine

## Sustainability (ADM environments only)

Passive Redshift external schema reading AWS CUR data from SRE shared-services S3 bucket. No ETL — queried on-demand via QuickSight. Defined in `sustainability.yml`, schema managed by Flyway.

## IaC Structure

- `iac/main/` — Primary app (14 resource files)
- `iac/quicksight-access/` — Cognito + API Gateway + QuickSight lambda
- `iac/core/` — Shared KMS keys
- `statemachine/` — ASL JSON definitions (7 files)
- `raw-to-stage/` — Python ETL package
- `redshift-scripts/flyway/` — Redshift migrations

## Deployment

- **Lower envs** (dev, build): Deploy from GitHub Actions
- **Higher envs** (staging, integration, production): Promoted via Secure Pipelines
- **production-preview**: Manual `sam deploy` via dedicated GitHub Action
