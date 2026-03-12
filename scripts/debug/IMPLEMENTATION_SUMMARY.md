# Debug Capability Implementation Summary

## Overview
Successfully implemented the debug capability from `txma-audit` into `data-analytics-platform`. This enables local Lambda debugging directly in Node.js without Docker or SAM, with full breakpoint support in VS Code and IntelliJ.

## What Was Implemented

### 1. Core Scripts
- **`scripts/debug/invoke-local.ts`** - Main entry point that loads environment variables, creates a mock Lambda context, and invokes handlers
  - Adapted to use `src/handlers/` instead of `src/lambdas/`
  - Uses `data-analytics-platform-dev` as the default AWS profile
  - Supports all 18 Lambda handlers in the repository

### 2. Setup Scripts
- **`scripts/debug/setup/install-run-configs.sh`** - Generates IDE debug configurations
  - Auto-discovers all handlers from `src/handlers/` directory
  - Creates VS Code `launch.json` with debug configuration for each handler
  - Provides IntelliJ setup instructions
  
- **`scripts/debug/setup/fetch-env-vars.sh`** - Fetches environment variables from deployed Lambda functions
  - Discovers Lambda functions from SAM templates in `iac/main/` directory
  - Merges environment variables from all deployed functions
  - Applies local overrides (XRAY_ENABLED=false, etc.)
  - Outputs to `env-vars.json`

### 3. Event Files
Created event template files for all 18 handlers in `scripts/debug/events/`:
- `athena-get-config.json`
- `athena-get-statement.json` (with realistic structure)
- `cognito-post-authentication.json`
- `cognito-quicksight-access.json`
- `dlq-to-eventbridge.json` (with realistic SQS/S3 event)
- `quicksight-export.json`
- `quicksight-import.json`
- `redshift-create-snapshot.json`
- `redshift-error-notification.json`
- `redshift-get-metadata.json`
- `redshift-rotate-secret.json`
- `run-flyway-command.json`
- `s3-notifications-logger.json` (with realistic S3 event)
- `s3-raw-to-staging.json` (with realistic S3 event)
- `s3-send-metadata.json` (with realistic S3 event)
- `stepfunction-validate-execution.json`
- `test-support.json`
- `txma-event-consumer.json` (with realistic SQS event)

### 4. Configuration Files
- **`scripts/debug/env-vars.json`** - Initial template with common environment variables
- **`.vscode/launch.json`** - Generated VS Code debug configurations (18 configurations, one per handler)

### 5. Documentation
- **`scripts/debug/README.md`** - Complete documentation covering:
  - Prerequisites
  - Setup instructions
  - Usage for VS Code and IntelliJ
  - How to add new Lambda handlers
  - Notes and tips

### 6. Directory Structure
```
scripts/debug/
├── assets/              # For static test assets
├── events/              # Test event payloads (18 files)
├── setup/               # Setup scripts
│   ├── fetch-env-vars.sh
│   └── install-run-configs.sh
├── env-vars.json        # Environment variables
├── invoke-local.ts      # Main entry point
└── README.md            # Documentation
```

## Key Adaptations from txma-audit

1. **Handler Path**: Changed from `src/lambdas/` to `src/handlers/`
2. **AWS Profile**: Changed from `audit-dev` to `data-analytics-platform-dev`
3. **Template Discovery**: Adapted to search SAM templates in `iac/main/` directory
4. **Handler Naming**: Uses kebab-case (e.g., `s3-send-metadata`) matching directory names
5. **Event Files**: Created 18 event files (vs 5 in txma-audit) to cover all handlers

## How to Use

### Initial Setup
```bash
# 1. Install run configurations
bash scripts/debug/setup/install-run-configs.sh

# 2. Fetch environment variables from dev
aws sso login --profile data-analytics-platform-dev
bash scripts/debug/setup/fetch-env-vars.sh
```

### VS Code Debugging
1. Open Run & Debug panel (⇧⌘D)
2. Select a configuration (e.g., "Debug s3-send-metadata")
3. Press F5 to start debugging
4. Set breakpoints in handler code

### IntelliJ Debugging
Follow the instructions printed by `install-run-configs.sh` to create Node.js run configurations.

### Manual Invocation
```bash
ts-node scripts/debug/invoke-local.ts <handlerName>
# Example:
ts-node scripts/debug/invoke-local.ts s3-send-metadata
```

## Next Steps for Users

1. **Customize Event Files**: Update the JSON files in `scripts/debug/events/` with realistic test data for your use cases
2. **Add Test Assets**: Place any required test files in `scripts/debug/assets/`
3. **Update Environment Variables**: Run `fetch-env-vars.sh` whenever the deployed configuration changes
4. **Add New Handlers**: When adding new Lambda handlers, just run the setup scripts again - they auto-discover handlers

## Files Not Changed
As requested, no files were modified in `txma-audit/scripts/debug/` - it remains the source of truth.

## Testing
- ✅ VS Code launch.json generated successfully with 18 configurations
- ✅ IntelliJ instructions generated successfully
- ✅ All 18 event files created
- ✅ Scripts are executable
- ✅ Directory structure matches txma-audit pattern
