#!/bin/bash -e

# see https://stackoverflow.com/a/246128
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
REGION="eu-west-2"
ENVIRONMENT=$1

# validate environment for the benefit of local execution (it will have already been validated if running via the github action)
"$SCRIPT_DIR/validate-environment.sh" "$ENVIRONMENT"

FILES_ROOT="athena-scripts"
S3_BUCKET="s3://$(echo "$ENVIRONMENT" | tr '[:upper:]' '[:lower:]')-dap-elt-metadata"

echo "Uploading contents of $FILES_ROOT to bucket $S3_BUCKET"

aws --region="$REGION" s3 cp "$FILES_ROOT"/dml/utils "$S3_BUCKET"/txma/utils --recursive --include "*.sql"
aws --region="$REGION" s3 cp "$FILES_ROOT"/dml/insert_into "$S3_BUCKET"/txma/insert_statements/ --recursive --include "*.sql"
aws --region="$REGION" s3 cp "$FILES_ROOT"/process_scripts "$S3_BUCKET"/txma/process_config/ --recursive --include "*.json"
aws --region="$REGION" s3 cp "$FILES_ROOT"/data_quality_scripts "$S3_BUCKET"/txma/data_quality_metrics_script/ --recursive --include "*.py"
aws --region="$REGION" s3 cp "$FILES_ROOT"/redshift_scripts "$S3_BUCKET"/txma/redshift_scripts/ --recursive --include "*.sql" --include "*.json"
aws --region="$REGION" s3 cp "$FILES_ROOT"/raw_stage_optimisation_solution/configuration_rules "$S3_BUCKET"/txma/raw_stage_optimisation_solution/configuration_rules --recursive --include "*.json"
aws --region="$REGION" s3 cp "$FILES_ROOT"/raw_stage_optimisation_solution/scripts "$S3_BUCKET"/txma/raw_stage_optimisation_solution/scripts --recursive --include "*.py"
aws --region="$REGION" s3 cp "$FILES_ROOT"/raw_stage_optimisation_solution/athena_db_object "$S3_BUCKET"/txma/raw_stage_optimisation_solution/athena_db_object --recursive --include "*.sql"
aws --region="$REGION" s3 cp "$FILES_ROOT"/reference_data_ingestion/scripts "$S3_BUCKET"/reference_data/manual_curated_dataset_ingestion/scripts --recursive --include "*.py"
aws --region="$REGION" s3 cp "$FILES_ROOT"/reference_data_ingestion/configuration_files "$S3_BUCKET"/reference_data/configuration_files --recursive --include "*.json"