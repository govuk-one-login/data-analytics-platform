#!/bin/bash -e

# see https://stackoverflow.com/a/246128
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
REGION="eu-west-2"
ENVIRONMENT=$1
ENVIRONMENT_LOWER=$(echo "$ENVIRONMENT" | tr '[:upper:]' '[:lower:]')

# validate environment for the benefit of local execution (it will have already been validated if running via the github action)
"$SCRIPT_DIR/validate-environment.sh" "$ENVIRONMENT"

FILES_ROOT="athena-scripts"
S3_BUCKET="s3://$ENVIRONMENT_LOWER-dap-elt-metadata"

echo "Replacing environment placeholder in DML files"

# see https://stackoverflow.com/a/28070251 and https://singhkays.com/blog/sed-error-i-expects-followed-by-text for why sed -i gets an empty string arg
find "$FILES_ROOT"/dml -type f -name "*.sql" -print0 | xargs -0 sed -i'' "s/environment/$ENVIRONMENT_LOWER/g"

echo "Uploading contents of $FILES_ROOT to bucket $S3_BUCKET"

aws --region="$REGION" s3 cp "$FILES_ROOT"/dml/utils "$S3_BUCKET"/txma/utils --recursive --include "*.sql"
aws --region="$REGION" s3 cp "$FILES_ROOT"/dml/insert_into "$S3_BUCKET"/txma/insert_statements/ --recursive --include "*.sql"
aws --region="$REGION" s3 cp "$FILES_ROOT"/process_scripts "$S3_BUCKET"/txma/process_config/ --recursive --include "*.json"
