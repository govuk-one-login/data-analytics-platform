#!/bin/bash -e

EXCLUDED_BRANCH_PREFIXES=("dependabot/" "no-int-test/")

BRANCH_NAME=$1

if [ -z "$BRANCH_NAME" ]; then
  echo "Branch name not provided"
  echo "Usage: should-deploy-to-feature.sh BRANCH_NAME"
  exit 1
fi

for prefix in "${EXCLUDED_BRANCH_PREFIXES[@]}"; do
  if [[ $BRANCH_NAME == $prefix* ]]; then
    echo "valid=false"
    exit 0
  fi
done

echo "valid=true"
