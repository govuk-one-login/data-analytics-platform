#!/bin/bash -e

# see https://stackoverflow.com/a/246128
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

ENVIRONMENT=$1
AWS_ACCOUNT_ID=$2

usage_and_exit() {
  echo "Usage: prepare-redshift-migrations.sh [-d] ENVIRONMENT AWS_ACCOUNT_ID"
  echo "  environment must be one of dev, build, staging, integration or production"
  echo "  account id must be a 12 digit aws account id"
  exit 1
}

if [ -z "$ENVIRONMENT" ] || [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "Environment and/or AWS account id not provided"
  usage_and_exit
fi

# validate environment for the benefit of local execution (it will have already been validated if running via the github action)
if ! "$SCRIPT_DIR/validate-environment.sh" "$ENVIRONMENT" 1> /dev/null; then
  usage_and_exit
fi

# validate aws account id
if ! [[ "$AWS_ACCOUNT_ID" =~ ^[0-9]{12}$ ]]; then
  usage_and_exit
fi

LOWERCASE_ENVIRONMENT=$(echo "$ENVIRONMENT" | tr '[:upper:]' '[:lower:]')
MIGRATIONS_DIR="redshift-scripts/migrations"

# this stops the script throwing an error if redshift-scripts/migrations doesn't exist or does exist but contains no .sql files
# see https://unix.stackexchange.com/questions/239772/bash-iterate-file-list-except-when-empty
shopt -s nullglob
for file in "$MIGRATIONS_DIR"/*.sql; do
  # to make this work on a mac you may need to put an empty string argument after the -i flag
  # e.g. sed -i '' "s/{env}/$LOWERCASE_ENVIRONMENT/g" "$file"
  # this is something to do with bsd sed rather than gnu sed
  sed -i "s/{env}/$LOWERCASE_ENVIRONMENT/g" "$file"
  sed -i "s/{aws-account-id}/$AWS_ACCOUNT_ID/g" "$file"
done
