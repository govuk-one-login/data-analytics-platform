"""Strategy is base class for ETL strategies."""

import gc
import json
import sys
from abc import ABC, abstractmethod
from datetime import datetime

import pandas as pd

from ..exceptions.no_data_found_exception import NoDataFoundException
from ..logging.logger import get_logger
from ..util.json_config_processing_utilities import extract_element_by_name_and_validate


class Strategy(ABC):
    """This class has default implementations for transform and load methods."""

    METADATA_ROOT_FOLDER = "txma_raw_stage_metadata"
    DATASET = True
    INSERT_MODE = "append"
    ROW_NUM = "ROW_NUM"
    DATE_CREATED = "datecreated"

    def __init__(self, args, config_data, glue_client, s3_client, preprocessing) -> None:
        """Initialise variables.

        Parameters
         args (dict): Glue job arguments
         config_data (json obj): JSON Config file as object
         glue_client (GlueTableQueryAndWrite): Glue client
         s3_client (S3ReadWrite): S3 client
         preprocessing (DataPreprocessing): Object to execute preprocessing functions

        Returns
         None
        """
        self.args = args
        self.config_data = config_data
        self.glue_client = glue_client
        self.s3_client = s3_client
        self.preprocessing = preprocessing
        self.athena_query_chunksize = 1000000
        self.logger = get_logger(__name__)

    @abstractmethod
    def extract(self):
        """For implementation by subclasses."""
        pass

    def transform(self, df_raw):
        """Transform pandas dataframe if not empty. Perform various transformations on input df.

        Parameters
         df_raw (Pandas Dataframe): Input dataframe

        Returns
         df_stage (Pandas Dataframe): Transformed Staging table Dataframe
         df_key_values (Pandas Dataframe): Transformed Key Value table Dataframe
         duplicate_rows_removed (int): No of duplicate rows removed
         stage_table_rows_to_be_inserted (int): No of rows to be inserted into stage table
         stage_key_rows_inserted (int): No of rows to be inserted into key value table
        """
        if not isinstance(df_raw, pd.DataFrame) or df_raw.empty:
            raise NoDataFoundException("No raw records returned for processing. Program is stopping.")

        # Collect all error DataFrames
        all_errors = []

        df_stage = self.preprocessing.remove_columns_by_json_config(self.config_data, df_raw)

        df_stage, error_df = self.preprocessing.remove_row_duplicates(self.config_data, df_stage)
        if not error_df.empty:
            all_errors.append(error_df)

        df_raw_row_count = int(len(df_raw))
        df_raw_post_deduplication_row_count = int(len(df_stage))
        duplicate_rows_removed = df_raw_row_count - df_raw_post_deduplication_row_count

        # Remove rows with missing mandatory field values
        df_stage = self.preprocessing.remove_rows_missing_mandatory_values_by_json_config(self.config_data, df_stage)

        # Extract a list of column names from the original df_raw dataframe
        df_raw_col_names_original = list(df_stage.columns)

        df_stage = self.preprocessing.parse_string_columns_as_json_by_config(self.config_data, df_raw)
        df_stage = self.preprocessing.rename_column_names_by_json_config(self.config_data, df_stage)

        df_stage = self.preprocessing.add_new_column_by_json_config(self.config_data, df_stage)

        df_stage = self.preprocessing.add_new_column_from_struct_by_json_config(self.config_data, df_stage)
        df_stage = self.preprocessing.add_new_column_from_formatted_string_by_json_config(self.config_data, df_stage)

        # Empty string replacement with sql null
        df_stage = self.preprocessing.empty_string_to_null_by_json_config(self.config_data, df_stage)

        df_stage = self.preprocessing.duplicate_column_by_json_config(self.config_data, df_stage)

        if self.ROW_NUM in df_raw_col_names_original:
            df_raw_col_names_original.remove(self.ROW_NUM)
        if self.DATE_CREATED in df_raw_col_names_original:
            df_raw_col_names_original.remove(self.DATE_CREATED)

        self.logger.info("df_raw cols: %s", df_raw_col_names_original)
        self.logger.info("rows to be ingested into the Stage layer from dataframe df_raw: %s", len(df_stage))
        stage_table_rows_to_be_inserted = int(len(df_stage))

        # Generate dtypes - for stage table
        stage_schema_columns = extract_element_by_name_and_validate(self.config_data, "columns", "stage_schema")

        # Generate dtypes - for key/value table
        stage_key_value_schema_columns = extract_element_by_name_and_validate(self.config_data, "columns", "key_value_schema")

        # Generate key/value pairs
        df_key_values = self.preprocessing.generate_key_value_records_by_json_config(
            self.config_data,
            df_stage,
            stage_key_value_schema_columns,
            df_raw_col_names_original,
        )

        df_key_values = df_key_values[~((df_key_values["value"].isna()) | (df_key_values["value"] == "null"))]

        self.logger.info("rows to be ingested into the Stage layer key/value table from dataframe df_key_values: %s", len(df_key_values))
        stage_key_rows_inserted = int(len(df_key_values))

        # Generate list object with column names only
        # Enables selecting specific columns from df_raw
        # Extract column names as list
        stage_select_col_names_list = list(stage_schema_columns.keys())
        df_stage = df_stage[stage_select_col_names_list]
        # Combine all error DataFrames
        if all_errors:
            combined_error_df = pd.concat(all_errors, ignore_index=True)
        else:
            combined_error_df = pd.DataFrame()

        return df_stage, df_key_values, combined_error_df, duplicate_rows_removed, stage_table_rows_to_be_inserted, stage_key_rows_inserted

    def load(self, df_stage, df_key_values):
        """Load staging, key value dataframes into respective glue tables.

        Parameters
         df_stage (Pandas Dataframe): Transformed Staging table Dataframe
         df_key_values (Pandas Dataframe): Transformed Key Value table Dataframe

        Returns
         None
        """
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
