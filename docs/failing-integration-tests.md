# Troubleshooting Failing Integration Tests

## Malformed data in the raw layer

If the raw-to-stage Glue job fails with a JSON parsing error like:

```
Exception Error within function parse_json: Expecting property name enclosed in double quotes
```

This means there is a record with invalid JSON in one of the parsed columns (`extensions`, `user`, `txma`, or `restricted`).

### Finding the malformed data

Run this query in Athena (workgroup: `{env}-dap-txma-processing`):

```sql
SELECT event_id, event_name, extensions, "user", txma, restricted
FROM "{env}-txma-raw"."txma-refactored"
WHERE cast(concat(substr(datecreated, 6,4),substr(datecreated, 17, 2),substr(datecreated, 24, 2)) as int) >= {YYYYMMDD}
  AND cast(timestamp as int) > {unix_timestamp}
  AND (
    (extensions IS NOT NULL AND extensions != '' AND try(json_parse(extensions)) IS NULL)
    OR ("user" IS NOT NULL AND "user" != '' AND try(json_parse("user")) IS NULL)
    OR (txma IS NOT NULL AND txma != '' AND try(json_parse(txma)) IS NULL)
    OR (restricted IS NOT NULL AND restricted != '' AND try(json_parse(restricted)) IS NULL)
  )
LIMIT 10
```

Replace `{env}` with the environment (e.g. `build`, `dev`) and set the date/timestamp filters to match the window the Glue job is processing. You can find these values in the Glue job output logs.

### Deleting the malformed data

The raw layer is S3-backed so you cannot delete via Athena. Delete the file directly from S3.

If you don't know the exact date partition, find the file first:

```sh
aws s3api list-objects-v2 \
  --bucket {env}-dap-raw-layer \
  --prefix "txma-refactored/year=2026/month=05" \
  --query "Contents[?contains(Key, '{event_id}')]" \
  --profile {profile}
```

Then delete it:

```sh
aws s3api delete-object \
  --bucket {env}-dap-raw-layer \
  --key "txma-refactored/year={YYYY}/month={MM}/day={DD}/{event_id}.json.gz" \
  --profile {profile}
```
txma-refactored/year=2026/month=05/day=20/6485c18c-0d0a-4900-9c75-933508a9e3c4.json.gz
### Common cause

This is typically caused by the unhappy path integration tests (`invalid-json.spec.ts`) which intentionally write malformed JSON to test error handling. If a test run is interrupted before cleanup completes, the malformed record persists. The cleanup only deletes from today's date partition, so stale data from previous days won't be removed automatically.

The global teardown now cleans up the last 7 days of test data to mitigate this, but older stale data may still need manual removal.
