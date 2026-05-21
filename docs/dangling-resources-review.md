# Pipeline Resource Audit — Dangling Resources

**Date:** 2026-05-21
**Author:** Ian Wallis
**Purpose:** Identify IaC-defined resources that are no longer wired into the active pipeline, for review and potential removal.

## Background

An audit of the DAP IaC and state machine definitions was performed to trace the active data pipeline and identify resources that are deployed but never triggered or invoked by any active workflow.

## Active Pipeline Summary

```
TxMA SQS → txma-event-consumer → Firehose → S3 Raw Layer
    │
    ▼ [Daily cron 01:20 UTC]
    TxmaRawLayerConsolidatedSchemaProcessingStateMachine
    ├── RawStageTransformProcessPythonGlueJob (raw → stage)
    ├── DataQualityStageLayerOptimisedPythonGlueJob (stage metrics)
    └── RedshiftConsolidatedModelProcessingStateMachine (stage → conform)
        ├── Redshift stored procedures (dims, facts, extensions)
        └── ADMConsolidatedModelProcessingStateMachine (production/production-preview only)
            └── ADMV3RefreshStateMachine

Reference Data Pipeline:
    S3 upload (.csv) → s3-raw-to-staging → s3-send-metadata → SQS FIFO → EventBridge Pipe
    → ProcessReferenceDataStateMachine → redshift-get-metadata → Glue Job → Redshift

Supporting:
    redshift-create-snapshot ← Daily schedule (22:00)
    redshift-rotate-secret ← SecretsManager rotation
    redshift-error-notification ← CloudWatch Subscription Filter
    s3-notifications-logger ← EventBridge (all S3 events)
    dlq-to-eventbridge ← SQS DLQs
    run-flyway-command ← Manual (GitHub Action)
    test-support ← Manual (integration tests)
```

## Dangling Resources

The following resources are defined in the IaC and deployed to all environments, but are **not triggered by any schedule, event source, or parent state machine**. They appear to be remnants of older pipeline versions.

### 1. RedshiftProcessingStateMachine

| | |
|---|---|
| **IaC file** | `iac/main/resources/state-machine.yml` |
| **ASL definition** | `statemachine/redshift_elt_processing.asl.json` |
| **Deployed name** | `{env}-dap-redshift-processing` |
| **Trigger** | None |
| **Build account activity** | Never executed |
| **Reason dangling** | Superseded by `RedshiftConsolidatedModelProcessingStateMachine` which is invoked as a child of the main raw-to-stage state machine. This is the old non-refactored ELT that used `conformed.sp_setup_conformed_schema()`. |

### 2. AthenaGetConfigLambda

| | |
|---|---|
| **IaC file** | `iac/main/resources/athena.yml` |
| **Handler** | `src/handlers/athena-get-config/handler.ts` |
| **Deployed name** | `athena-get-config-{env}` |
| **Trigger** | None |
| **Build account activity** | 0 invocations (30 days) |
| **Reason dangling** | Only referenced in `statemachine/athena_raw_layer_processing.asl.json`, which is **not deployed** as a state machine resource in the IaC. This was the old Athena-based raw layer processing pipeline. |

### 3. AthenaGetStatementLambda

| | |
|---|---|
| **IaC file** | `iac/main/resources/athena.yml` |
| **Handler** | `src/handlers/athena-get-statement/handler.ts` |
| **Deployed name** | `athena-get-statement-{env}` |
| **Trigger** | None |
| **Build account activity** | 0 invocations (30 days) |
| **Reason dangling** | Same as above — only used by the old undeployed Athena pipeline. |

### 4. DataQualityPythonGlueJob

| | |
|---|---|
| **IaC file** | `iac/main/resources/state-machine.yml` |
| **Deployed name** | `{env}-dap-data-quality-metrics-generation` |
| **Trigger** | None |
| **Build account activity** | Never run |
| **Reason dangling** | Superseded by `DataQualityStageLayerOptimisedPythonGlueJob` (`{env}-dap-data-quality-new-stage-metrics-generation`) which IS invoked by the active state machine. This is the old version that read from both raw and stage layers. |

### 5. SplunkMigratedRawStageTransformProcessPythonGlueJob

| | |
|---|---|
| **IaC file** | `iac/main/resources/state-machine.yml` |
| **Deployed name** | `{env}-dap-splunk-migration-raw-stage-transform-process` |
| **Trigger** | None |
| **Build account activity** | Never run |
| **Reason dangling** | One-off migration job for processing Splunk-migrated data with a different schema. Not referenced by any state machine or event trigger. Migration is likely complete. |

### 6. SplunkRawLayerSingleTableCrawler

| | |
|---|---|
| **IaC file** | `iac/main/resources/raw.yml` |
| **Deployed name** | `splunk_migrated_data_fixed_schema` |
| **Trigger** | None (no schedule, no EventBridge rule) |
| **Build account activity** | N/A |
| **Reason dangling** | Glue crawler for the Splunk migration data. No automated trigger — would need to be run manually. Related to the Splunk migration which appears complete. |

## Undeployed ASL Definition

| File | Status |
|---|---|
| `statemachine/athena_raw_layer_processing.asl.json` | Present in repo but **no IaC resource references it**. This was the original Athena-based raw-to-stage pipeline, superseded by the consolidated schema approach using Glue jobs. |

## Proposed Actions

| # | Action | Resources affected | Risk |
|---|---|---|---|
| 1 | Remove from IaC | `RedshiftProcessingStateMachine`, its log group, `StepFunctionRedshiftProcessRole` | Low — never triggered in build |
| 2 | Remove from IaC | `AthenaGetConfigLambda`, `AthenaGetStatementLambda` | Low — verify integration tests don't invoke directly |
| 3 | Remove from IaC | `DataQualityPythonGlueJob` | Low — superseded by optimised version |
| 4 | Remove from IaC | `SplunkMigratedRawStageTransformProcessPythonGlueJob` | Low — migration complete |
| 5 | Remove from IaC | `SplunkRawLayerSingleTableCrawler`, `SplunkMigrationGlueTable` | Low — migration complete |
| 6 | Delete from repo | `statemachine/athena_raw_layer_processing.asl.json` | None — not deployed |
| 7 | Delete from repo | `statemachine/redshift_elt_processing.asl.json` (after #1) | None — after IaC removal |

## Questions to Confirm

1. Are the Athena lambdas (`athena-get-config`, `athena-get-statement`) invoked directly by integration tests? If so, are those tests still needed or are they testing the old pipeline?
2. Is the Splunk migration fully complete across all environments including production?
3. Should we also remove the `AthenaWorkGroup` and `AthenaWorkgroupBucket` if nothing else uses Athena, or do analysts use it for ad-hoc queries?
4. The `RedshiftProcessingStateMachine` has associated alarms (`RedshiftProcessingStepFunctionRetryingAlarm`) — these should be removed too.

## Related: Orphaned Resources in AWS Accounts

A separate audit (`scripts/audit-orphaned-resources.sh`) identified resources that exist in AWS but are not in any CloudFormation stack. See `orphaned-resources-dev.md` for the dev account findings.
