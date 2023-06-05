#!/bin/bash -e

ENVIRONMENT=$1

if [ -z "$1" ]; then
  echo "Environment not provided"
  echo "Usage: validate-environment.sh ENVIRONMENT"
  exit 1
fi

VALID_ENVIRONMENTS=("DEV" "BUILD" "TEST" "STAGING" "INTEGRATION" "PRODUCTION")

for env in "${VALID_ENVIRONMENTS[@]}"; do
    if [ "${ENVIRONMENT}" == "${env}" ]; then
      exit 0
    fi
done

echo "Invalid environment: \"$ENVIRONMENT\""
exit 1
