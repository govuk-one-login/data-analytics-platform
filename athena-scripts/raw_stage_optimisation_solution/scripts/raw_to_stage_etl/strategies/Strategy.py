import gc
import json
import logging
import sys
from abc import ABC, abstractmethod
from datetime import datetime

import pandas as pd

from ..logger import logger
from ..util.processing_utilities import (add_new_column, add_new_column_from_struct, empty_string_to_null,
                                         extract_element_by_name_and_validate, generate_key_value_records,
                                         remove_columns, remove_row_duplicates, remove_rows_missing_mandatory_values,
                                         rename_column_names)


class Strategy(ABC):
    METADATA_ROOT_FOLDER = "txma_raw_stage_metadata"
    DATASET = True
    INSERT_MODE = "append"

    def __init__(self, args, config_data, glue_client, s3_client, preprocessing) -> None:
        self.args = args
        self.config_data = config_data
        self.glue_client = glue_client
        self.s3_client = s3_client
        self.preprocessing = preprocessing
        self.athena_query_chunksize = 1000000
        self.logger = logging.getLogger(__name__)
        logger.init(args)
        logger.configure(self.logger)

    @abstractmethod
    def extract(self):
        pass

    def get_raw_data(self, sql_query):
        self.logger.info("running query %s", sql_query)

        dfs = self.glue_client.query_glue_table(self.args["raw_database"], sql_query, self.athena_query_chunksize)
        if dfs is None:
            raise ValueError(f"Function: query_glue_table returned None.  Using query {str(sql_query)}")

        return dfs

    ROW_NUM = "ROW_NUM"

    def transform(self, df_raw):
        if not isinstance(df_raw, pd.DataFrame) or df_raw.empty:
            self.logger.info("No raw records returned for processing. Program is stopping.")
            return

        df_raw_row_count = int(len(df_raw))

        df_stage = remove_columns(self.preprocessing, self.config_data, df_raw)
        if df_stage is None:
            raise ValueError("Function: remove_columns returned None.")

        # Remove row duplicates
        df_stage = remove_row_duplicates(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: remove_row_duplicates returned None.")

        if df_stage.empty:
            self.logger.info("No raw records returned for processing following duplicate row removal. Program is stopping.")
            return

        df_raw_post_deduplication_row_count = int(len(df_stage))
        duplicate_rows_removed = df_raw_row_count - df_raw_post_deduplication_row_count

        # Remove rows with missing mandatory field values
        df_stage = remove_rows_missing_mandatory_values(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: remove_rows_missing_mandatory_values returned None.")

        if df_stage.empty:
            self.logger.info("No raw records returned for processing following missing mandatory fields row removal. Program is stopping.")
            return

        # Extract a list of column names from the original df_raw dataframe
        df_raw_col_names_original = list(df_stage.columns)
        if self.ROW_NUM in df_raw_col_names_original:
            df_raw_col_names_original.remove(self.ROW_NUM)
        self.logger.info("df_raw cols: %s", df_raw_col_names_original)

        # Rename column(s)
        df_stage = rename_column_names(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: rename_column_names returned None.")

        if df_stage.empty:
            self.logger.info("No raw records returned for processing following rename of columns. Program is stopping.")
            return

        # New column(s)
        df_stage = add_new_column(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: add_new_column returned None.")

        if df_stage.empty:
            self.logger.info("No raw records returned for processing following adding of new columns. Program is stopping.")
            return

        # New column(s) from struct
        df_stage = add_new_column_from_struct(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: add_new_column_from_struct returned None.")

        if df_stage.empty:
            self.logger.info("No raw records returned for processing following adding of new columns from struct. Program is stopping.")
            return

        # Empty string replacement with sql null
        df_stage = empty_string_to_null(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: empty_string_to_null returned None.")

        if df_stage.empty:
            self.logger.info("No raw records returned for processing following replacement of empty strings with null. Program is stopping.")
            return
        self.logger.info("rows to be ingested into the Stage layer from dataframe df_raw: %s", len(df_stage))
        stage_table_rows_inserted = int(len(df_stage))

        # Generate dtypes - for stage table
        stage_schema_columns = extract_element_by_name_and_validate(self.config_data, "columns", "stage_schema")

        # Generate dtypes - for key/value table
        stage_key_value_schema_columns = extract_element_by_name_and_validate(self.config_data, "columns", "key_value_schema")

        # Generate key/value pairs
        df_key_values = generate_key_value_records(
            self.preprocessing,
            self.config_data,
            df_stage,
            stage_key_value_schema_columns,
            df_raw_col_names_original,
        )

        if df_key_values is None:
            raise ValueError("Function: generate_key_value_records returned None.")

        if df_key_values.empty:
            self.logger.info("No raw records returned for processing following the generation of key/value records. Program is stopping.")
            return
        self.logger.info("rows to be ingested into the Stage layer key/value table from dataframe df_key_values: %s", len(df_key_values))
        stage_key_rows_inserted = int(len(df_key_values))

        # Generate list object with column names only
        # Enables selecting specific columns from df_raw
        # Extract column names as list
        stage_select_col_names_list = list(stage_schema_columns.keys())
        df_stage = df_stage[stage_select_col_names_list]
        return df_stage, df_key_values, duplicate_rows_removed, stage_table_rows_inserted, stage_key_rows_inserted

    def load(self, df_stage, df_key_values):
        # write to glue database
        # 1. Key/value table
        # 2. Stage table
        try:
            stage_bucket = self.args["stage_bucket"]
            stage_target_table = self.args["stage_target_table"]
            stage_target_key_value_table = self.args["stage_target_key_value_table"]

            # Generate dtypes - for key/value table
            stage_key_value_schema_columns = extract_element_by_name_and_validate(self.config_data, "columns", "key_value_schema")

            # Retrieve partition columns - for stage table
            stage_key_value_schema_partition_columns = extract_element_by_name_and_validate(self.config_data, "partition_columns", "key_value_schema")

            stage_key_value_update = self.glue_client.write_to_glue_table(
                df_key_values,
                f"s3://{stage_bucket}/{stage_target_key_value_table}/",
                self.DATASET,
                self.args["stage_database"],
                self.INSERT_MODE,
                self.args["stage_target_key_value_table"],
                stage_key_value_schema_columns,
                stage_key_value_schema_partition_columns,
            )

            if not stage_key_value_update:
                sys.exit("Update to stage key/value table did not return boolean(True) response")
            else:
                self.logger.info("stage_key_value_update: %s", stage_key_value_update)
            raw_metadata_time_json = f'raw_stage_metadata_{datetime.now().strftime("%Y%m%d%H%M%S")}.json'
            # write Glue table insert metadata to S3
            http_response = self.s3_client.write_json(
                stage_bucket,
                f'{self.METADATA_ROOT_FOLDER}/{stage_target_key_value_table}/{datetime.now().strftime("%Y%m%d")}/{raw_metadata_time_json}',
                json.dumps(stage_key_value_update),
            )
            if http_response is None:
                sys.exit("Insert of stage key/value table metadata returned invalid response")

            # Generate dtypes - for stage table
            stage_schema_columns = extract_element_by_name_and_validate(self.config_data, "columns", "stage_schema")

            # Retrieve partition columns - for stage table
            stage_schema_partition_columns = extract_element_by_name_and_validate(self.config_data, "partition_columns", "stage_schema")

            stage_table_update = self.glue_client.write_to_glue_table(
                df_stage,
                f"s3://{stage_bucket}/{stage_target_table}/",
                self.DATASET,
                self.args["stage_database"],
                self.INSERT_MODE,
                self.args["stage_target_table"],
                stage_schema_columns,
                stage_schema_partition_columns,
            )
            if not stage_table_update:
                sys.exit("Update to stage table did not return boolean(True) response")
            raw_metadata_time_json = f'raw_stage_metadata_{datetime.now().strftime("%Y%m%d%H%M%S")}.json'
            # write Glue table insert metadata to S3
            http_response = self.s3_client.write_json(
                stage_bucket,
                f'{self.METADATA_ROOT_FOLDER}/{stage_target_table}/{datetime.now().strftime("%Y%m%d")}/{raw_metadata_time_json}',
                json.dumps(stage_table_update),
            )
            if http_response is None:
                sys.exit("Insert of stage table metadata returned invalid response")
        except Exception as e:
            self.logger.error("Exception Error writing to Stage layer: %s", str(e))
        finally:
            # Release dataframe memory
            del df_stage
            del df_key_values

            gc.collect()  # Explicitly trigger garbage collection
