#!/bin/bash

# This script will only run in AWS Codepipeline. It has access to the following environment variables:
# CFN_<OUTPUT-NAME> - Stack output value (replace <OUTPUT-NAME> with the name of the output)
# TEST_REPORT_ABSOLUTE_DIR - Absolute path to where the test report file should be placed
# TEST_REPORT_DIR - Relative path from current directory to where the test report file should be placed
# TEST_ENVIRONMENT - The environment the pipeline is running the tests in

# This file needs to be located at the root when running in the container. The path /test-app is defined
# in the Dockerfile. this can be commented later
#cd /test-app || exit 1

#Env variables will be reviwed and added as and when we integrate with pipeline
#export CONFIG_NAME=${ENV_NAME}
export ENV_NAME=$(echo $SAM_STACK_NAME | cut -d - -f 3-)
export TXMA_QUEUE_URL=$CFN_TXMA_QueueURL
export TXMA_BUCKET=$CFN_TXMA_BUCKET

npm run integration-test

TESTS_EXIT_CODE=$?

cp reports/testReport.xml $TEST_REPORT_ABSOLUTE_DIR/junit.xml

if [ $TESTS_EXIT_CODE -ne 0 ]; then
  exit 1
fi
