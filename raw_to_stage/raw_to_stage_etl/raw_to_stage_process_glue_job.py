"""Glue job main script."""

import json
import os
import sys
import traceback

from awsglue.utils import getResolvedOptions
from raw_to_stage_etl.clients.GlueTableQueryAndWrite import GlueTableQueryAndWrite
from raw_to_stage_etl.clients.S3ReadWrite import S3ReadWrite
from raw_to_stage_etl.exceptions.NoDataFoundException import NoDataFoundException
from raw_to_stage_etl.logging.logger import get_logger
from raw_to_stage_etl.processor.Processor import RawToStageProcessor
from raw_to_stage_etl.strategies.BackfillStrategy import BackfillStrategy
from raw_to_stage_etl.strategies.CustomStrategy import CustomStrategy
from raw_to_stage_etl.strategies.ScheduledStrategy import ScheduledStrategy
from raw_to_stage_etl.strategies.ViewStrategy import ViewStrategy
from raw_to_stage_etl.util.DataPreprocessing import DataPreprocessing
from raw_to_stage_etl.util.exceptions.UtilExceptions import OperationFailedException
from raw_to_stage_etl.util.json_config_processing_utilities import extract_element_by_name

logger = get_logger(__name__)


def main():
    """Start of the glue job. It controls flow of the whole job."""
    try:
        # Glue Job Inputs
        args = getResolvedOptions(
            sys.argv,
            [
                "JOB_NAME",
                "LOG_LEVEL",
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
        # Fetch LOG_LEVEL or set default logging level at INFO
        os.environ["LOG_LEVEL"] = args.get("LOG_LEVEL", "INFO")
        global logger
        logger = get_logger(__name__)

        # init all helper classes

        # S3 config file reader class
        s3_app = S3ReadWrite(args)

        # Glue processing class
        glue_app = GlueTableQueryAndWrite(args)

        # Data transformation class
        preprocessing = DataPreprocessing(args)

        json_data = s3_app.read_json(args["config_bucket"], args["config_key_path"])
        if json_data is None:
            raise ValueError("Class 's3_app' returned None, which is not allowed.")
        logger.debug("configuration rules: %s", json.dumps(json_data))

        job_type = get_job_type(json_data)
        processor = None
        strategy = None

        if job_type is None:
            raise ValueError("No job type specified to run")

        if job_type == "CUSTOM":
            processor = RawToStageProcessor(args, CustomStrategy(args, json_data, glue_app, s3_app, preprocessing))
        elif job_type == "VIEW":
            processor = RawToStageProcessor(args, ViewStrategy(args, json_data, glue_app, s3_app, preprocessing))
        elif job_type == "SCHEDULED":
            strategy = ScheduledStrategy(args, json_data, glue_app, s3_app, preprocessing)
            processor = RawToStageProcessor(args, strategy)

        processor.process()

        """
        This next part of the process(Backfill) for SCHEDULED will be temporary until we figure out a way to load
        events that were missing from the previous job
        TODO: remove the backfill part of the job when there is no need.
        """
        if job_type == "SCHEDULED":
            backfill_strategy = BackfillStrategy(args, json_data, glue_app, s3_app, preprocessing, strategy.max_timestamp, strategy.max_processed_dt)
            processor = RawToStageProcessor(args, backfill_strategy)
            try:
                processor.process()
            except (NoDataFoundException, OperationFailedException) as e:
                logger.info("Exception Message: %s, Stacktrace: %s", str(e), traceback.format_exc())
                # as no data could be found for backfill, supress the exception
                logger.info("Exiting without raising error(As no data could be found for backfill)")

    except ValueError as e:
        logger.error("Value Error: %s, Stacktrace: %s", str(e), traceback.format_exc())
        sys.exit("Exception encountered within main, exiting process")

    except Exception as e:
        logger.error("Exception Error: %s, Stacktrace: %s", str(e), traceback.format_exc())
        sys.exit("Exception encountered within main, exiting process")


def get_job_type(json_data):
    """Decide name of the strategy to invoke based on config file.

    Parameters:
     json_data

    Returns
     string: name of the strategy to be used
    """
    event_processing_testing_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_testing_criteria")
    if event_processing_testing_criteria_enabled is None:
        raise ValueError("enabled value for event_processing_testing_criteria is not found within config rules")
    logger.info("config rule: event_processing_testing_criteria | enabled: %s", event_processing_testing_criteria_enabled)

    if event_processing_testing_criteria_enabled:
        return "TESTING"
    event_processing_view_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_view_criteria")
    if event_processing_view_criteria_enabled is None:
        raise ValueError("enabled value for event_processing_view_criteria is not found within config rules")
    logger.info("config rule: event_processing_view_criteria | enabled: %s", event_processing_view_criteria_enabled)

    if event_processing_view_criteria_enabled:
        return "VIEW"

    return "SCHEDULED"


if __name__ == "__main__":
    main()
