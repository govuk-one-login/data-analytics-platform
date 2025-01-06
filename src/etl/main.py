import json
import sys

from awsglue.utils import getResolvedOptions
from clients.DataPreprocessing import DataPreprocessing
from clients.GlueTableQueryAndWrite import GlueTableQueryAndWrite
from clients.S3ReadWrite import S3ReadWrite
from Processor import RawToStageProcessor
from strategies.CustomStrategy import CustomStrategy
from strategies.ScheduledStrategy import ScheduledStrategy
from strategies.ViewStrategy import ViewStrategy
from util.processing_utilities import extract_element_by_name


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
        # init all helper classes

        # S3 config file reader class
        s3_app = S3ReadWrite()

        # Glue processing class
        glue_app = GlueTableQueryAndWrite()

        # Data transformation class
        preprocessing = DataPreprocessing()

        json_data = s3_app.read_json(args["config_bucket"], args["config_key_path"])
        if json_data is None:
            raise ValueError("Class 's3_app' returned None, which is not allowed.")
        formatted_json = json.dumps(json_data, indent=4)
        print(f"configuration rules:\n {formatted_json}")

        job_type = get_job_type(json_data)
        processor = None

        if job_type is None:
            raise ValueError("No job type specified to run")

        if job_type == "TESTING":
            processor = RawToStageProcessor(CustomStrategy(args, json_data, glue_app, s3_app, preprocessing))

        elif job_type == "VIEW":
            processor = RawToStageProcessor(ViewStrategy(args, json_data, glue_app, s3_app, preprocessing))

        elif job_type == "SCHEDULED":
            processor = RawToStageProcessor(ScheduledStrategy(args, json_data, glue_app, s3_app, preprocessing))

        processor.process()

    except ValueError as e:
        print(f"Value Error: {e}")
        sys.exit("Exception encountered within main, exiting process")

    except Exception as e:
        print(f"Exception Error: {str(e)}")
        sys.exit("Exception encountered within main, exiting process")


def get_job_type(json_data):
    event_processing_testing_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_testing_criteria")
    if event_processing_testing_criteria_enabled is None:
        raise ValueError("enabled value for event_processing_testing_criteria is not found within config rules")
    print(f"config rule: event_processing_testing_criteria | enabled: {event_processing_testing_criteria_enabled}")

    if event_processing_testing_criteria_enabled:
        return "TESTING"
    event_processing_view_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_view_criteria")
    if event_processing_view_criteria_enabled is None:
        raise ValueError("enabled value for event_processing_view_criteria is not found within config rules")
    print(f"config rule: event_processing_view_criteria | enabled: {event_processing_view_criteria_enabled}")

    if event_processing_view_criteria_enabled:
        return "VIEW"

    return "SCHEDULED"


if __name__ == "__main__":
    main()
