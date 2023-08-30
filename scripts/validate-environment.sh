#!/bin/bash -e

DEPLOYABLE_ENVIRONMENTS=("DEV" "BUILD" "TEST" "FEATURE")
HIGHER_ENVIRONMENTS=("STAGING" "INTEGRATION" "PRODUCTION")

DEPLOY=0
VALID_ENVIRONMENTS+=("${DEPLOYABLE_ENVIRONMENTS[@]}")

for arg in "$@"; do
  if [ "$arg" == "-d" ]; then
    DEPLOY=1
  else
    ENVIRONMENT=$arg
  fi
done

if [ -z "$ENVIRONMENT" ]; then
  echo "Environment not provided"
  echo "Usage: validate-environment.sh [-d] ENVIRONMENT"
  exit 1
fi

# if intent is not to deploy then the higher environments can be added to the list of valid environments
if [ $DEPLOY == 0 ]; then
  VALID_ENVIRONMENTS+=("${HIGHER_ENVIRONMENTS[@]}")
fi

for env in "${VALID_ENVIRONMENTS[@]}"; do
  if [ "${ENVIRONMENT}" == "${env}" ]; then
    exit 0
  fi
done

[ $DEPLOY == 1 ] && DEPLOY_MESSAGE=" for deployment"
echo "Invalid environment$DEPLOY_MESSAGE: \"$ENVIRONMENT\""
exit 1
