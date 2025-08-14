#!/bin/bash -e

lowercase_environment=$(echo "$1" | tr '[:upper:]' '[:lower:]')
runtype=$(echo "$2" | tr '[:upper:]' '[:lower:]')
ROOT=$(pwd)

cd $ROOT/raw-to-stage

#install all dependencies
python3 -m pip install -r requirements.txt
python3 -m pip install build

# run unit tests and fail script if they fail
python3 -m pytest
pytest_exit_status=$?
if [ $pytest_exit_status -eq 0 ]; then
  echo "Pytest succeeded"
else
  echo "Pytest failed"
  exit 1
fi

python3 -m build
python_build_exit_status=$?
if [ $python_build_exit_status -eq 0 ]; then
  echo "Build succeeded"
else
  echo "Build failed"
  exit 1
fi

if [ "$runtype" != "local" ]; then
  REGION="eu-west-2"
  FILES_ROOT="./dist"
  ETL_ROOT="./raw_to_stage_etl"
  DESTINATION_PATH="s3://$(echo "$lowercase_environment")-dap-elt-metadata/txma/raw_to_stage/"
  COMMIT_SHA=$(git rev-parse HEAD)
  COMMIT_MESSAGE=$(git log -1 --pretty=%s)
  echo "Uploading contents of $FILES_ROOT to bucket $S3_BUCKET"
  pwd
  ls $FILES_ROOT
  BUCKET_NAME="$(echo "$lowercase_environment")-dap-elt-metadata"
  COMMIT_MESSAGE_CLEAN=$(echo "$COMMIT_MESSAGE" | sed 's/ (#[0-9]*)$//' | head -c 256)

  # Upload files with metadata
  for file in $(find "$FILES_ROOT" -type f); do
    key="txma/raw_to_stage/$(basename "$file")"
    aws --region="$REGION" s3api put-object --bucket "$BUCKET_NAME" --key "$key" --body "$file" --metadata "Commit-Sha=$COMMIT_SHA,Commit-Message=$COMMIT_MESSAGE_CLEAN" > /dev/null
  done

  echo "Uploading raw_to_stage_process_glue_job.py from $CURRENT_DIR to s3 path $DESTINATION_PATH"
  aws --region="$REGION" s3api put-object --bucket "$BUCKET_NAME" --key "txma/raw_to_stage/raw_to_stage_process_glue_job.py" --body "$ETL_ROOT/raw_to_stage_process_glue_job.py" --metadata "Commit-Sha=$COMMIT_SHA,Commit-Message=$COMMIT_MESSAGE_CLEAN" > /dev/null
fi
