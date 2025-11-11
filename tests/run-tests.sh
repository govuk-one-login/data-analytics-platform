#!/bin/bash
cd /test-app || exit 1

if [ "$TEST_ENVIRONMENT" = "build" ]; then
  if [ "$SAM_STACK_NAME" = "dap" ]; then
    npm run test:integration:ci
    TESTS_EXIT_CODE=$?
  else
    echo "Integration tests not enabled for $SAM_STACK_NAME"
    TESTS_EXIT_CODE=0
  fi
elif [ "$TEST_ENVIRONMENT" = "staging" ]; then
  echo "Integration tests not enabled for staging environment"
  TESTS_EXIT_CODE=0
else
  echo "No Test Environment Set"
  exit 1
fi

if [ -f "tests/integration-tests/reports/junit.xml" ]; then
  cp tests/integration-tests/reports/junit.xml "$TEST_REPORT_ABSOLUTE_DIR/junit.xml"
fi
exit $TESTS_EXIT_CODE
