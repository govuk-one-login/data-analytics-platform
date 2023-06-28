#!/bin/bash -e

ENVIRONMENT_VARIABLES=("TXMA_BUCKET" "TXMA_QUEUE_URL")
ERROR_MESSAGE="Please fix the following errors:"

for var in "${ENVIRONMENT_VARIABLES[@]}"; do
    if ! env | grep --quiet "$var"; then
      ERROR_MESSAGE="$ERROR_MESSAGE$(echo -e "\n  - $var environment variable is not set")"
    fi
done

if [[ "$ERROR_MESSAGE" == *$'\n'* ]]; then
  echo "$ERROR_MESSAGE"
  exit 1
fi
