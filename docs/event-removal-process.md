# Event Removal Process

This document describes the automated process for removing problematic events from both the stage and conformed layers in the Data Analytics Platform.

## Overview

When events flow into the stage/conformed layers with incompatible fields that cause pipeline failures, you can now use automated tools to remove them. The solution supports two removal strategies:

1. **Partition-based removal** - Remove entire partitions by date (and optionally event name)
2. **Individual event removal** - Remove specific events by event ID

## Partition Structure

The stage layer uses partition structure: `processed_dt=yyyyMMdd/event_name/file.parquet`

For millions of events, partition-based removal is much more efficient than individual event ID removal.

## Methods Available

### 1. GitHub Action (Recommended)

**File**: `.github/workflows/remove-events.yml`

**Usage**:
1. Go to GitHub Actions tab
2. Select "Remove Events from Stage and Conformed Layers"
3. Click "Run workflow"
4. Fill in the parameters:
   - **Environment**: Choose target environment
   - **Removal Type**: Choose `partition` or `event_ids`
   - **For partition removal**:
     - **Processed Date**: Date in YYYYMMDD format (e.g., `20241201`)
     - **Event Name**: Optional specific event name (leave blank to remove all events for the date)
   - **For event ID removal**:
     - **Event IDs**: Comma-separated list (e.g., `event1,event2,event3`)
   - **Removal Reason**: Why these events need to be removed
   - **Requested By**: Your name/identifier

### 2. Local Script

**File**: `scripts/remove-events.sh`

**Usage**:
```bash
# Partition removal - all events for a date
./scripts/remove-events.sh <environment> partition <YYYYMMDD> <reason> <requested_by>

# Partition removal - specific event name for a date
./scripts/remove-events.sh <environment> partition <YYYYMMDD> <event_name> <reason> <requested_by>

# Individual event removal
./scripts/remove-events.sh <environment> event_ids <event_ids> <reason> <requested_by>
```

**Examples**:
```bash
# Remove all events for December 1st, 2024
./scripts/remove-events.sh dev partition 20241201 "Corrupted data" "john.doe"

# Remove only AUTH_ACCOUNT_CREATED events for December 1st, 2024
./scripts/remove-events.sh dev partition 20241201 AUTH_ACCOUNT_CREATED "Bad timestamp format" "jane.smith"

# Remove specific event IDs
./scripts/remove-events.sh dev event_ids "event123,event456" "Individual bad events" "john.doe"
```

## What Gets Removed

### Stage Layer (S3)
- **Partition removal**: Deletes entire S3 prefixes like `s3://bucket/processed_dt=20241201/` or `s3://bucket/processed_dt=20241201/AUTH_ACCOUNT_CREATED/`
- **Individual removal**: Queries Athena to find specific file paths, then deletes those S3 objects
- **Partition repair**: Runs `MSCK REPAIR TABLE` to update Athena's partition metadata

### Conformed Layer (Athena Tables)
- Records from `conformed.fact_user_journey_event`
- Records from `conformed.dim_event`
- Filtered by `date` and optionally `event_name` for partition removal
- Filtered by `event_id` for individual removal

## Choosing Removal Strategy

### Use Partition Removal When:
- You have millions of events to remove
- All events for a specific date are problematic
- A specific event type for a date is problematic
- Performance is critical

### Use Individual Event Removal When:
- You have a small number of specific problematic events
- Only certain events within a partition are bad
- You need surgical precision

## Safety Features

1. **Input Validation**: Date format and parameters are validated
2. **Confirmation Required**: Both methods require explicit confirmation
3. **Verification**: Automatic verification queries to confirm removal
4. **Audit Trail**: All removals are logged with timestamp, reason, and requester
5. **Environment Validation**: Only valid environments are accepted

## Technical Implementation

### Stage Layer (S3 Files)
Since Athena cannot delete data from S3, the solution:
1. **Partition removal**: Uses `aws s3 rm --recursive` to delete entire S3 prefixes
2. **Individual removal**: Queries Athena to find file paths using `"$path"` column, then deletes specific S3 objects
3. **Partition repair**: Runs `MSCK REPAIR TABLE` to sync Athena metadata with S3 changes

### Conformed Layer (Athena Tables)
Uses standard Athena `DELETE` statements since these are actual tables, not S3 files.

### Process Flow
1. **Input Validation**: Parameters validated based on removal type
2. **S3 Deletion**: Remove files/partitions from stage layer S3 bucket
3. **Athena Deletion**: Remove records from conformed layer tables
4. **Partition Repair**: Update Athena partition metadata
5. **Verification**: Query both layers to confirm removal
6. **Logging**: Complete audit trail

## Performance Considerations

**Partition Removal**:
- Very fast for large datasets
- Leverages Athena's partition pruning
- Can remove millions of events in minutes

**Individual Event Removal**:
- Slower for large datasets
- Requires full table scans
- Best for < 1000 events

## After Removal

Once events are removed, you can:
1. Fix the underlying issue (DAP scripts or producer data)
2. Use the existing event replay functionality to reprocess corrected events
3. Monitor the pipeline to ensure no further issues

## Extending the Solution

To add removal from additional tables:
1. Edit the SQL generation sections in either tool
2. Add DELETE statements for new tables
3. Update verification queries to include new tables

## Security Considerations

- Requires appropriate AWS permissions for Athena queries
- GitHub Action uses environment-specific secrets
- All actions are logged and auditable
- Confirmation steps prevent accidental deletions