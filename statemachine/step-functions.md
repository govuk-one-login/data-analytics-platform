# State Machines

This directory contains [Amazon States Language (ASL)](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html) definitions for the Step Functions used in the DAP ETL pipeline.

## Orchestrator state machines

| File | Description |
|------|-------------|
| `txma_raw_layer_consolidated_schema_processing.asl.json` | Main pipeline orchestrator. Runs the raw-to-stage Glue job, triggers data quality checks, then invokes the Redshift processing step function. Triggered daily on a schedule. |
| `txma_redshift_consolidated_schema_processing.asl.json` | Redshift ELT orchestrator. Runs dimension upserts in parallel, then sequentially runs the fact table upsert, event extensions upsert, and batch table update. Conditionally triggers ADM processing in production environments. |
| `txma_adm_consolidated_schema_processing.asl.json` | Refreshes presentation ADM views in Redshift. Triggered by the Redshift consolidated processing step function in ADM environments. |
| `txma_adm_v3_refresh_processing.asl.json` | ADM v3 refresh processing workflow. Triggered by the ADM consolidated processing step function. |

## Child state machines (Redshift stored procedure executors)

These are invoked by `txma_redshift_consolidated_schema_processing.asl.json`. Each follows the same pattern: execute a Redshift stored procedure via the Data API, then poll every 120 seconds until completion.

### Parallel group (dimension upserts)

These 5 run concurrently:

| File | Stored Procedure |
|------|-----------------|
| `redshift_dim_event_upsert.asl.json` | `conformed_refactored.dim_event_upsert()` |
| `redshift_dim_user_journey_event_upsert.asl.json` | `conformed_refactored.dim_user_journey_event_upsert()` |
| `redshift_dim_user_refactored_upsert.asl.json` | `conformed_refactored.dim_user_refactored_upsert()` |
| `redshift_dim_journey_channel_refactored_upsert.asl.json` | `conformed_refactored.dim_journey_channel_refactored_upsert()` |
| `redshift_dim_relying_party_refactored_upsert.asl.json` | `conformed_refactored.dim_relying_party_refactored_upsert()` |

### Sequential group (run inline, in order after parallel group completes)

The following three procedures run inline within the parent orchestrator (not as child state machines):

1. `conformed_refactored.fact_user_journey_event_refactored_upsert()`
2. `conformed_refactored.event_extensions_refactored_upsert()`
3. `conformed_refactored.update_event_batch_table()`

## Legacy state machines

| File | Description |
|------|-------------|
| `athena_raw_layer_processing.asl.json` | Processes raw datasets from TxMA into the staging layer of Athena (non-consolidated schema). |
| `redshift_elt_processing.asl.json` | Legacy Redshift ELT processing workflow. |
| `reference_data_processing.asl.json` | Processes reference datasets manually curated by the business. |

## Execution flow

```
txma_raw_layer_consolidated_schema_processing
│
├── 1. Raw-to-Stage Glue Job (sync)
├── 2. Data Quality Glue Job (async)
└── 3. txma_redshift_consolidated_schema_processing (sync)
    │
    ├── 3a. Parallel dimension upserts
    │   ├── redshift_dim_event_upsert
    │   ├── redshift_dim_user_journey_event_upsert
    │   ├── redshift_dim_user_refactored_upsert
    │   ├── redshift_dim_journey_channel_refactored_upsert
    │   └── redshift_dim_relying_party_refactored_upsert
    │
    ├── 3b. fact_user_journey_event_refactored_upsert (inline)
    ├── 3c. event_extensions_refactored_upsert (inline)
    ├── 3d. update_event_batch_table (inline)
    │
    └── 3e. [production only] txma_adm_consolidated_schema_processing
        └── txma_adm_v3_refresh_processing
```
