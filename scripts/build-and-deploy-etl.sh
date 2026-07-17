#!/bin/bash -e

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
