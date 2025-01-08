import json
import sys

from AthenaReadWrite import AthenaReadWrite
from awsglue.utils import getResolvedOptions
from core_preprocessing_functions import *
from DataPreprocessing import DataPreprocessing
from GlueTableQueryAndWrite import GlueTableQueryAndWrite
from processor import *
from S3ReadWrite import S3ReadWrite


def main():
    try:
        # Glue Job Inputs
        args = getResolvedOptions(
            sys.argv,
            [
                "JOB_NAME",
                "config_bucket",
                "config_key_path",
                "txma_raw_dedup_view_key_path",
                "workgroup",
                "raw_database",
                "raw_source_table",
                "stage_database",
                "stage_target_table",
                "stage_target_key_value_table",
                "stage_bucket",
            ],
        )

        # S3 config file reader class
        s3_app = S3ReadWrite()

        # Glue processing class
        glue_app = GlueTableQueryAndWrite()

        # Data transformation class
        preprocessing = DataPreprocessing()

        # Athena processing class
        athena_app = AthenaReadWrite()

        # Trigger regeneration of raw layer deduplication view
        # Required to avoid "stale" view error, which occurs when new fields
        # are introduced within the txma table, hence the view definition is out of date
        # Read deduplication view definition sql

        """
        # commented out due to timeout issues being experienced within account
        # mitigation is to use the txma source table from (raw) until the issue
        # can be resolved.

        view_sql = s3_app.read_file(args['config_bucket'], args['txma_raw_dedup_view_key_path'])
        if view_sql is None:
            raise ValueError("Class 's3_json_reader' returned None, which is not allowed.")

        view_generation_sql = view_sql.replace('raw_database', str(args['raw_database']))
        print(view_generation_sql)

        # Execute the view script which recreates the Athena view definition
        athena_query_response = athena_app.run_query(args['raw_database'],view_generation_sql,args['workgroup'])
        if not athena_query_response:
            sys.exit(f"Class 'athena_app' returned False when executing query {str(view_generation_sql)}")
        """

        # Read config rules json
        json_data = s3_app.read_json(args["config_bucket"], args["config_key_path"])
        if json_data is None:
            raise ValueError("Class 's3_app' returned None, which is not allowed.")

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")

        formatted_json = json.dumps(json_data, indent=4)
        print(f"configuration rules:\n {formatted_json}")

        process_job(json_data, args, glue_app, s3_app, preprocessing)

    except ValueError as e:
        print(f"Value Error: {e}")
        sys.exit("Exception encountered within main, exiting process")

    except Exception as e:
        print(f"Exception Error: {str(e)}")
        sys.exit("Exception encountered within main, exiting process")


if __name__ == "__main__":
    main()
