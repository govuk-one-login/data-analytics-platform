import json
import sys
import time
import gc
from datetime import datetime

import pandas as pd

from awsglue.utils import getResolvedOptions
from S3ReadWrite import S3ReadWrite
from GlueTableQueryAndWrite import GlueTableQueryAndWrite
from DataPreprocessing import DataPreprocessing
from AthenaReadWrite import AthenaReadWrite
from Processor import RawToStageProcessor
from strategies import *

from core_preprocessing_functions import *


def main():

    athena_query_chunksize = 1000000

    try:

        # Glue Job Inputs
        args = getResolvedOptions(sys.argv,
                                  ['JOB_NAME',
                                   'config_bucket',
                                   'config_key_path',
                                   'txma_raw_dedup_view_key_path',
                                   'workgroup',
                                   'raw_database',
                                   'raw_source_table',
                                   'stage_database',
                                   'stage_target_table',
                                   'stage_target_key_value_table',
                                   'stage_bucket'])
        # init all helper classes
        
        # S3 config file reader class
        s3_app = S3ReadWrite()

        # Glue processing class
        glue_app = GlueTableQueryAndWrite()

        # Data transformation class
        preprocessing = DataPreprocessing()

        # Athena processing class
        athena_app = AthenaReadWrite()
        
        processor = None
        
        json_data = s3_app.read_json(
            args['config_bucket'], args['config_key_path'])
        if json_data is None:
            raise ValueError(
                "Class 's3_app' returned None, which is not allowed.")
        formatted_json = json.dumps(json_data, indent=4)
        print(f'configuration rules:\n {formatted_json}')

        # Trigger regeneration of raw layer deduplication view
        # Required to avoid "stale" view error, which occurs when new fields
        # are introduced within the txma table, hence the view definition is out of date
        # Read deduplication view definition sql
        job_type = get_job_type(json_data)

        if job_type is None: 
            raise ValueError("No job type specified to run")
        
        if job_type is 'TESTING':
            processor = RawToStageProcessor(CustomStrategy(json_data, glue_app, s3_app))

        elif job_type is 'VIEW':
            processor = RawToStageProcessor(ViewStrategy(json_data, glue_app, s3_app))

        elif job_type is 'SCHEDULED':
            processor = RawToStageProcessor(ScheduledStrategy(json_data, glue_app, s3_app))

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
    print(f'config rule: event_processing_testing_criteria | enabled: {event_processing_testing_criteria_enabled}')

    if event_processing_testing_criteria_enabled:
        return 'TESTING'
    event_processing_view_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_view_criteria")
    if event_processing_view_criteria_enabled is None:
        raise ValueError("enabled value for event_processing_view_criteria is not found within config rules")
    print(f'config rule: event_processing_view_criteria | enabled: {event_processing_view_criteria_enabled}')

    if event_processing_view_criteria_enabled:
        return 'VIEW'

    return 'SCHEDULED'


if __name__ == "__main__":
    main()
