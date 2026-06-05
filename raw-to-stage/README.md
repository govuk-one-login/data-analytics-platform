# Raw-to-Stage ETL Job

## Overview

A Python-based AWS Glue ETL job that transforms raw TxMA event data (from the raw S3 layer) into a structured stage layer. It reads data via Athena, applies config-driven transformations using Pandas, and writes Parquet to Glue tables.

## Architecture

The job follows a **Strategy pattern** with an ETL (Extract, Transform, Load) pipeline:

```
Entry Point (Glue Job)
  └── Processor (orchestrates ETL loop)
        └── Strategy (pluggable extraction logic)
              ├── ScheduledStrategy - daily scheduled runs
              ├── CustomStrategy - ad-hoc/testing runs
              └── ViewStrategy - reads from an Athena view
```

## Key Components

### Entry Point — `raw_to_stage_process_glue_job.py`

- Parses Glue job arguments (databases, tables, buckets, config paths)
- Reads a JSON config file from S3 that drives all behaviour
- Selects the appropriate strategy based on config flags (`CUSTOM` → `VIEW` → `SCHEDULED` priority)

### Processor — `processor/processor.py`

- Iterates over chunked DataFrames returned by `extract()`
- Calls `transform()` then `load()` for each chunk
- Tracks metrics (rows inserted, duplicates removed, time elapsed)

### Strategies

| Strategy | Extract Logic |
|----------|--------------|
| **ScheduledStrategy** | Queries raw table filtering by `max_processed_dt` and `max_timestamp` from the stage table, subtracting 20 mins from timestamp to catch Firehose-buffered events |
| **CustomStrategy** | Uses a custom filter from config, deduplicates by `event_id` (keeps latest `datecreated`) |
| **ViewStrategy** | Simply selects all rows from a named Athena view |

### Transform (in base `Strategy`)

Config-driven pipeline that sequentially:

1. Removes unwanted columns
2. Deduplicates rows
3. Removes rows missing mandatory fields
4. Parses string columns as JSON
5. Renames columns
6. Adds new computed columns (e.g. `processed_dt`, `processed_time`)
7. Extracts struct fields into new columns
8. Extracts regex-based columns from formatted strings
9. Replaces empty strings with NULL
10. Duplicates columns
11. Generates a key-value extension table (flattened nested fields)

### Load (in base `Strategy`)

- Writes the stage DataFrame and key-value DataFrame to Glue tables as Parquet (via `awswrangler`)
- Writes metadata JSON to S3 after each write

### Clients

| Client | Purpose |
|--------|---------|
| `GlueTableQueryAndWrite` | Queries Athena via `awswrangler`, writes Parquet to Glue tables |
| `S3ReadWrite` | Reads/writes JSON and files to S3 via `boto3` |
| `AthenaReadWrite` | Runs raw Athena queries with polling (used outside the main ETL path) |

### Utilities

| Module | Purpose |
|--------|---------|
| `database_utilities` | Gets `max_processed_dt`, `max_timestamp`, handles date arithmetic, Firehose buffer subtraction |
| `json_config_processing_utilities` | Recursive JSON config traversal, filter extraction/validation |
| `data_preprocessing` | All DataFrame transformation functions (column removal, renaming, dedup, key-value generation, struct extraction, etc.) |

## Dependencies

Key libraries: `awswrangler`, `boto3`, `pandas`, `numpy`, `awsglue`

## Building

```sh
pip3 install --upgrade build
python3 -m build
```

## Testing

Unit tests live in `tests/` mirroring the source structure, using `pytest` with `pytest-mock`.

```sh
python3 -m pytest
```

Test data includes sample config JSONs and transformation fixtures.
