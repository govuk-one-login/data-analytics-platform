# Quick Start Guide - Local Lambda Debugging

## 🚀 First Time Setup (5 minutes)

### 1. Install Debug Configurations
```bash
bash scripts/debug/setup/install-run-configs.sh
```
This creates `.vscode/launch.json` with debug configs for all 18 Lambda handlers.

### 2. Fetch Environment Variables
```bash
aws sso login --profile data-analytics-platform-dev
bash scripts/debug/setup/fetch-env-vars.sh
```
This pulls environment variables from deployed Lambda functions in dev.

## 🐛 Start Debugging

### VS Code
1. Open the Run & Debug panel: `⇧⌘D` (Shift+Cmd+D)
2. Select a handler from the dropdown (e.g., "Debug s3-send-metadata")
3. Press `F5` to start debugging
4. Set breakpoints in your handler code
5. The handler will execute with the event from `scripts/debug/events/<handler-name>.json`

### Command Line
```bash
ts-node scripts/debug/invoke-local.ts <handler-name>

# Examples:
ts-node scripts/debug/invoke-local.ts s3-send-metadata
ts-node scripts/debug/invoke-local.ts txma-event-consumer
ts-node scripts/debug/invoke-local.ts athena-get-statement
```

## 📝 Customize Test Events

Edit the JSON files in `scripts/debug/events/` to match your test scenarios:

```bash
# Example: Edit the S3 event for s3-send-metadata
vim scripts/debug/events/s3-send-metadata.json
```

## 🔄 When to Re-run Setup

### Re-fetch Environment Variables
Run this when Lambda environment variables change in AWS:
```bash
bash scripts/debug/setup/fetch-env-vars.sh
```

### Regenerate Debug Configs
Run this when you add new Lambda handlers:
```bash
bash scripts/debug/setup/install-run-configs.sh
```

## 📦 Available Handlers

All 18 handlers are ready to debug:
- `athena-get-config`
- `athena-get-statement`
- `cognito-post-authentication`
- `cognito-quicksight-access`
- `dlq-to-eventbridge`
- `quicksight-export`
- `quicksight-import`
- `redshift-create-snapshot`
- `redshift-error-notification`
- `redshift-get-metadata`
- `redshift-rotate-secret`
- `run-flyway-command`
- `s3-notifications-logger`
- `s3-raw-to-staging`
- `s3-send-metadata`
- `stepfunction-validate-execution`
- `test-support`
- `txma-event-consumer`

## 💡 Tips

- **Breakpoints**: Set breakpoints in any TypeScript file under `src/handlers/`
- **Environment Variables**: Check `scripts/debug/env-vars.json` to see what's available
- **AWS Profile**: The default profile is `data-analytics-platform-dev` (configurable in `invoke-local.ts`)
- **Logs**: PowerTools logger is set to DEBUG level automatically
- **X-Ray**: Disabled locally (set in `env-vars.json`)

## 🆘 Troubleshooting

### "Cannot find module" error
Make sure you've run `npm install` in the project root.

### AWS credentials expired
```bash
aws sso login --profile data-analytics-platform-dev
```

### Handler not found
Check that the handler name matches the directory name in `src/handlers/`.

## 📚 More Information

See `scripts/debug/README.md` for detailed documentation.
