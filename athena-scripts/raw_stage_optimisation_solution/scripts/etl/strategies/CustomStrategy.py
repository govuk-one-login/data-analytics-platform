import gc
import json
import sys
from datetime import datetime

import pandas as pd

from ..old.core_preprocessing_functions import (add_new_column, add_new_column_from_struct, empty_string_to_null,
                                                generate_key_value_records, remove_columns, remove_row_duplicates,
                                                remove_rows_missing_mandatory_values, rename_column_names)
from ..util.processing_utilities import extract_element_by_name
from .Strategy import Strategy

ROW_NUM = "ROW_NUM"
INSERT_MODE = "append"
DATASET = True
METADATA_ROOT_FOLDER = "txma_raw_stage_metadata"


class CustomStrategy(Strategy):

    def extract(self):
        event_processing_custom_filter = extract_element_by_name(self.self.config_data, "filter", "event_processing_testing_criteria")

        if event_processing_custom_filter is None:
            raise ValueError("filter value for event_processing_custom_filter is not found within config rules")
        print(f"config rule: event_processing_view_criteria | view: {event_processing_custom_filter}")

        sql_query = self.generate_sql_query(event_processing_custom_filter)

        return self.get_raw_data(sql_query)

    def generate_sql_query(self, custom_filter):
        deduplicate_subquery = f"""select *,
                                row_number() over (
                                        partition by event_id
                                        order by cast(
                                    concat(
                                        cast(year as varchar),
                                        cast(lpad(cast(month as varchar), 2, '0') as varchar),
                                        cast(lpad(cast(day as varchar), 2, '0') as varchar)
                                    ) as int
                                ) desc
                                        ) as row_num
                        from \"{self.args['raw_database']}\".\"{self.args['raw_source_table']}\" as t
                    where {custom_filter}"""
        return f"select * from ({deduplicate_subquery}) where row_num = 1"

    def transform(self, df_raw):
        if not isinstance(df_raw, pd.DataFrame):
            print("No raw records returned for processing. Program is stopping.")
            return

        if df_raw.empty:
            print("No raw records returned for processing. Program is stopping.")
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
            print("No raw records returned for processing following duplicate row removal. Program is stopping.")
            return

        df_raw_post_deduplication_row_count = int(len(df_stage))
        duplicate_rows_removed = df_raw_row_count - df_raw_post_deduplication_row_count

        # Remove rows with missing mandatory field values
        df_stage = remove_rows_missing_mandatory_values(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: remove_rows_missing_mandatory_values returned None.")

        if df_stage.empty:
            print("No raw records returned for processing following missing mandatory fields row removal. Program is stopping.")
            return
        # print(df_raw)

        # Extract a list of column names from the original df_raw dataframe
        df_raw_col_names_original = list(df_stage.columns)
        if ROW_NUM in df_raw_col_names_original:
            df_raw_col_names_original.remove(ROW_NUM)
        print(f"df_raw cols: {df_raw_col_names_original}")

        # Rename column(s)
        df_stage = rename_column_names(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: rename_column_names returned None.")

        if df_stage.empty:
            print("No raw records returned for processing following rename of columns. Program is stopping.")
            return
        # print(df_raw)

        # New column(s)
        df_stage = add_new_column(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: add_new_column returned None.")

        if df_stage.empty:
            print("No raw records returned for processing following adding of new columns. Program is stopping.")
            return
        # print(df_raw)

        # New column(s) from struct
        df_stage = add_new_column_from_struct(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: add_new_column_from_struct returned None.")

        if df_stage.empty:
            print("No raw records returned for processing following adding of new columns from struct. Program is stopping.")
            return
        # print(df_raw)

        # Empty string replacement with sql null
        df_stage = empty_string_to_null(self.preprocessing, self.config_data, df_stage)
        if df_stage is None:
            raise ValueError("Function: empty_string_to_null returned None.")

        if df_stage.empty:
            print("No raw records returned for processing following replacement of empty strings with null. Program is stopping.")
            return
        print(f"rows to be ingested into the Stage layer from dataframe df_raw: {len(df_stage)}")
        stage_table_rows_inserted = int(len(df_stage))

        # Generate dtypes - for stage table
        stage_schema_columns = extract_element_by_name(self.config_data, "columns", "stage_schema")
        if stage_schema_columns is None:
            raise ValueError("dtypes value for stage_schema is not found within config rules")
        print(f"stage layer schema:\n{json.dumps(stage_schema_columns, indent=4)}")

        # Generate dtypes - for key/value table
        stage_key_value_schema_columns = extract_element_by_name(self.config_data, "columns", "key_value_schema")
        if stage_key_value_schema_columns is None:
            raise ValueError("dtypes value for key_value_schema is not found within config rules")
        print(f"stage layer key/value schema:\n{json.dumps(stage_key_value_schema_columns, indent=4)}")

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
            print("No raw records returned for processing following the generation of key/value records. Program is stopping.")
            return
        print(f"rows to be ingested into the Stage layer key/value table from dataframe df_key_values: {len(df_key_values)}")
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
            stage_key_value_schema_columns = extract_element_by_name(self.config_data, "columns", "key_value_schema")
            if stage_key_value_schema_columns is None:
                raise ValueError("dtypes value for key_value_schema is not found within config rules")
            print(f"stage layer key/value schema:\n{json.dumps(stage_key_value_schema_columns, indent=4)}")

            # Retrieve partition columns - for stage table
            stage_key_value_schema_partition_columns = extract_element_by_name(self.config_data, "partition_columns", "key_value_schema")
            if stage_key_value_schema_partition_columns is None:
                raise ValueError("partition columns value for key_value_schema is not found within config rules")
            print(f"stage layer key/value partition column: {stage_key_value_schema_partition_columns}")

            stage_key_value_update = self.glue_client.write_to_glue_table(
                df_key_values,
                f"s3://{stage_bucket}/{stage_target_key_value_table}/",
                DATASET,
                self.args["stage_database"],
                INSERT_MODE,
                self.args["stage_target_key_value_table"],
                stage_key_value_schema_columns,
                stage_key_value_schema_partition_columns,
            )

            if not stage_key_value_update:
                sys.exit("Update to stage key/value table did not return boolean(True) response")
            raw_metadata_time_json = f'raw_stage_metadata_{datetime.now().strftime("%Y%m%d%H%M%S")}.json'
            # write Glue table insert metadata to S3
            http_response = self.s3_client.write_json(
                stage_bucket,
                f'{METADATA_ROOT_FOLDER}/{stage_target_key_value_table}/{datetime.now().strftime("%Y%m%d")}/{raw_metadata_time_json}',
                json.dumps(stage_key_value_update),
            )
            if http_response is None:
                sys.exit("Insert of stage key/value table metadata returned invalid response")

            # Generate dtypes - for stage table
            stage_schema_columns = extract_element_by_name(self.config_data, "columns", "stage_schema")
            if stage_schema_columns is None:
                raise ValueError("dtypes value for stage_schema is not found within config rules")
            print(f"stage layer schema:\n{json.dumps(stage_schema_columns, indent=4)}")

            # Retrieve partition columns - for stage table
            stage_schema_partition_columns = extract_element_by_name(self.config_data, "partition_columns", "stage_schema")
            if stage_schema_partition_columns is None:
                raise ValueError("partition columns value for stage_schema is not found within config rules")
            print(f"stage layer partition columns: {stage_schema_partition_columns}")

            stage_table_update = self.glue_client.write_to_glue_table(
                df_stage,
                f"s3://{stage_bucket}/{stage_target_table}/",
                DATASET,
                self.args["stage_database"],
                INSERT_MODE,
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
                f'{METADATA_ROOT_FOLDER}/{stage_target_table}/{datetime.now().strftime("%Y%m%d")}/{raw_metadata_time_json}',
                json.dumps(stage_table_update),
            )
            if http_response is None:
                sys.exit("Insert of stage table metadata returned invalid response")
        except Exception as e:
            print(f"Exception Error writing to Stage layer: {str(e)}")
        finally:
            # Release dataframe memory
            del df_stage
            del df_key_values

            gc.collect()  # Explicitly trigger garbage collection
