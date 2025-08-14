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

  echo "Uploading contents of $FILES_ROOT to bucket $S3_BUCKET"
  pwd
  ls $FILES_ROOT
  aws --region="$REGION" s3 cp "$FILES_ROOT" "$DESTINATION_PATH" --recursive
  echo "Uploading raw_to_stage_process_glue_job.py from $CURRENT_DIR to s3 path $DESTINATION_PATH"
  aws --region="$REGION" s3 cp "$ETL_ROOT/raw_to_stage_process_glue_job.py" "$DESTINATION_PATH"
fi
