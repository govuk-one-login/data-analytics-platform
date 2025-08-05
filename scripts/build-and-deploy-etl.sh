#!/bin/bash -e

lowercase_environment=${$1:"dev"}
runtype=$(echo "$2" | tr '[:upper:]' '[:lower:]')
ROOT=$(pwd)

cd $ROOT/raw-to-stage
python3 -m pip install build
python3 -m build

if [ "$runtype" != "local" ]
then
        REGION="eu-west-2"
        FILES_ROOT="./dist"
        S3_BUCKET="s3://$(echo "$lowercase_environment")-dap-elt-metadata/txma/raw-to-stage"

        echo "Uploading contents of $FILES_ROOT to bucket $S3_BUCKET"
        pwd
        ls $FILES_ROOT
        aws --region="$REGION" s3 cp "$FILES_ROOT" "$S3_BUCKET" --recursive
fi
