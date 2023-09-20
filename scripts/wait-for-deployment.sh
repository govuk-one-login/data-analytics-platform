#!/bin/bash -e

# we should be able to run `aws --region eu-west-2 cloudformation wait stack-update-complete --stack-name dap`
# but for some reason this was sometimes returning early when run from github actions

LATEST_BUILD=$(aws --region eu-west-2 codebuild list-builds-for-project --project-name Deploy-dap-feature-deploy --output json --query 'ids[0]' | sed 's/"//g')

PIPELINE_NAME=$(aws --region eu-west-2 codepipeline list-pipelines --output text --query 'pipelines[0].name')

STATUS=""
SECONDS=0

while [ "$STATUS" != "CREATE_COMPLETE" ] && [ "$STATUS" != "UPDATE_COMPLETE" ]; do
  STATUS=$(aws --region eu-west-2 cloudformation describe-stacks --stack-name dap --output text --query 'Stacks[0].StackStatus')
  sleep 2

  SECONDS=$((SECONDS + 2))
  if ((SECONDS > 600)); then
    echo "Waited for 10 minutes - giving up. Last status was $STATUS"
    exit 1
  fi
done
