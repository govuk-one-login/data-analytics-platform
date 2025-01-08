import gc
import json
import sys
import time
from datetime import datetime

import pandas as pd
from core_preprocessing_functions import *


def process_job(json_data, args, glue_app, s3_app, data_preprocessing):
    athena_query_chunksize = 1000000

    job_type = get_job_type(json_data)

    if job_type is None:
        raise ValueError("No job type specified to run")

    raw_database = args["raw_database"]
    raw_table = args["raw_source_table"]
    stage_database = args["stage_database"]
    stage_target_table = args["stage_target_table"]
    # stage_target_table = args['stage_target_key_value_table']
    stage_bucket = args["stage_bucket"]

    if job_type is "TESTING":
        testing_raw_sql = get_raw_sql_testing(json_data, raw_database, raw_table)
        # query raw layer
        dfs = get_raw_data(
            glue_app, raw_database, testing_raw_sql, athena_query_chunksize
        )
        # process results
        process_results(dfs, args, data_preprocessing, json_data, glue_app, s3_app)

    elif job_type is "VIEW":
        view_raw_sql = get_raw_sql_view(json_data, raw_database)
        # query raw layer
        dfs = get_raw_data(glue_app, raw_database, view_raw_sql, athena_query_chunksize)
        # process results
        process_results(dfs, args, data_preprocessing, json_data, glue_app, s3_app)

    elif job_type is "SCHEDULED":
        max_processed_dt = get_max_processed_dt(
            glue_app, raw_database, raw_table, stage_database, stage_target_table
        )
        if max_processed_dt is None:
            raise ValueError(
                "Function 'get_max_processed_dt' returned None, which is not allowed."
            )
        print(f"retrieved processed_dt filter value: {max_processed_dt}")

        max_timestamp = get_max_timestamp(glue_app, stage_database, stage_target_table)

        if max_timestamp is None:
            raise ValueError(
                "Function 'get_max_timestamp' returned None, which is not allowed."
            )
        print(f"retrieved timestamp filter value: {max_timestamp}")

        scheduled_raw_sql = get_raw_sql_scheduled(
            json_data, raw_database, raw_table, max_processed_dt, max_timestamp
        )
        # query raw layer
        dfs = get_raw_data(
            glue_app, raw_database, scheduled_raw_sql, athena_query_chunksize
        )

        # process results
        process_results(dfs, args, data_preprocessing, json_data, glue_app, s3_app)

        """
        This next part of the process will be temporary until we figure out a way to load events that were missing from the previous job
        TODO: remove the backfill part of the job when there is no need for it anymore
        """
        current_process_time = None

        # if the process_dt is today, that means there are multiple processes today, we need this value to filter it out from the daily processes
        if max_processed_dt == data_preprocessing.processed_dt:
            current_process_time = data_preprocessing.processed_time

        all_previous_processed_times = get_all_processed_times_per_day(
            glue_app,
            args["stage_database"],
            args["stage_target_table"],
            max_processed_dt,
            current_process_time,
        )

        filter_processed_time = get_last_processed_time(all_previous_processed_times)
        if filter_processed_time is None:
            print(f"no filter process time found, ending process")
            return

        all_previous_processed_dts = get_all_processed_dts(
            glue_app,
            args["stage_database"],
            args["stage_target_table"],
            max_processed_dt,
            data_preprocessing.processed_dt,
        )

        penultimate_processed_dt = get_penultimate_processed_dt(
            all_previous_processed_dts
        )
        if penultimate_processed_dt is None:
            print(f"no penultimate processed dt, ending process")
            return

        min_timestamp_filter_for_missing_events = get_min_timestamp_from_previous_run(
            all_previous_processed_times,
            glue_app,
            args["stage_database"],
            args["stage_target_table"],
            max_processed_dt,
            penultimate_processed_dt,
        )

        if min_timestamp_filter_for_missing_events is None:
            print(
                f"Could not calculate a minimum timestamp to filter for missing events, ending process"
            )
            return

        backfill_raw_sql = get_raw_sql_backfill(
            raw_database,
            raw_table,
            stage_database,
            stage_target_table,
            min_timestamp_filter_for_missing_events,
            max_timestamp,
            max_processed_dt,
            filter_processed_time,
            penultimate_processed_dt,
        )
        # query raw layer
        dfs = get_raw_data(
            glue_app, raw_database, backfill_raw_sql, athena_query_chunksize
        )

        process_results(dfs, args, data_preprocessing, json_data, glue_app, s3_app)


def get_raw_sql_testing(json_data, database, table):
    event_processing_testing_criteria_filter = extract_element_by_name(
        json_data, "filter", "event_processing_testing_criteria"
    )
    if event_processing_testing_criteria_filter is None:
        raise ValueError(
            "filter value for event_processing_testing_criteria is not found within config rules"
        )
    print(
        f"config rule: event_processing_testing_criteria | filter: {event_processing_testing_criteria_filter}"
    )

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
               		from \"{database}\".\"{table}\" as t 
                    where {event_processing_testing_criteria_filter}"""
    sql = f"select * from ({deduplicate_subquery}) where row_num = 1"
    return sql


def get_raw_sql_view(json_data, database):
    event_processing_view_criteria_view = extract_element_by_name(
        json_data, "view_name", "event_processing_view_criteria"
    )
    if event_processing_view_criteria_view is None:
        raise ValueError(
            "filter value for event_processing_view_criteria is not found within config rules"
        )
    print(
        f"config rule: event_processing_view_criteria | view: {event_processing_view_criteria_view}"
    )

    return f'select * from "{database}"."{event_processing_view_criteria_view}"'


def get_raw_sql_scheduled(
    json_data, database, table, filter_processed_dt, filter_timestamp
):
    event_processing_selection_criteria_filter = extract_element_by_name(
        json_data, "filter", "event_processing_selection_criteria"
    )
    if event_processing_selection_criteria_filter is None:
        raise ValueError(
            "filter value for event_processing_selection_criteria is not found within config rules"
        )
    print(
        f"config rule: event_processing_selection_criteria | filter: {event_processing_selection_criteria_filter}"
    )

    event_processing_selection_criteria_limit = extract_element_by_name(
        json_data, "limit", "event_processing_selection_criteria"
    )
    if event_processing_selection_criteria_limit is None:
        raise ValueError(
            "limit value for event_processing_selection_criteria is not found within config rules"
        )
    print(
        f"config rule: event_processing_selection_criteria | limit: {event_processing_selection_criteria_limit}"
    )

    update_filter = event_processing_selection_criteria_filter.replace(
        "processed_dt", str(filter_processed_dt - 1)
    ).replace("replace_timestamp", str(filter_timestamp))
    sql = f"""select * from \"{database}\".\"{table}\" where {update_filter}"""

    if (
        event_processing_selection_criteria_limit is not None
        and event_processing_selection_criteria_limit > 0
    ):
        sql = sql + f" limit {event_processing_selection_criteria_limit}"
    return sql


def get_raw_sql_backfill(
    raw_database,
    raw_table,
    stage_layer_database,
    stage_layer_target_table,
    filter_min_timestamp,
    filter_max_timestamp,
    filter_processed_dt,
    filter_processed_time,
    penultimate_processed_dt,
):
    return f"""
            SELECT *
            FROM \"{raw_database}\".\"{raw_table}\"
            WHERE event_id IN (
		            SELECT raw.event_id
		            FROM \"{raw_database}\".\"{raw_table}\" raw
			        LEFT OUTER JOIN \"{stage_layer_database}\".\"{stage_layer_target_table}\" sl ON raw.event_id = sl.event_id
                    AND sl.processed_dt = {filter_processed_dt}
                    AND sl.processed_time = {filter_processed_time}
		            WHERE sl.event_id is null
			        AND CAST(concat(raw.year, raw.month, raw.day) AS INT) >= {penultimate_processed_dt} - 1
			        AND CAST(raw.timestamp as int) > {filter_min_timestamp}
			        AND CAST(raw.timestamp as int) <= {filter_max_timestamp}
	        )
	        AND CAST(concat(year, month, day) AS INT) >= {penultimate_processed_dt} - 1"""


def get_job_type(json_data):
    event_processing_testing_criteria_enabled = extract_element_by_name(
        json_data, "enabled", "event_processing_testing_criteria"
    )
    if event_processing_testing_criteria_enabled is None:
        raise ValueError(
            "enabled value for event_processing_testing_criteria is not found within config rules"
        )
    print(
        f"config rule: event_processing_testing_criteria | enabled: {event_processing_testing_criteria_enabled}"
    )

    if event_processing_testing_criteria_enabled:
        return "TESTING"
    event_processing_view_criteria_enabled = extract_element_by_name(
        json_data, "enabled", "event_processing_view_criteria"
    )
    if event_processing_view_criteria_enabled is None:
        raise ValueError(
            "enabled value for event_processing_view_criteria is not found within config rules"
        )
    print(
        f"config rule: event_processing_view_criteria | enabled: {event_processing_view_criteria_enabled}"
    )

    if event_processing_view_criteria_enabled:
        return "VIEW"

    return "SCHEDULED"


def process_results(dfs, args, preprocessing, json_data, glue_app, s3_app):
    # constants
    insert_mode = "append"
    cummulative_stage_table_rows_inserted = 0
    cummulative_stage_key_rows_inserted = 0
    cummulative_duplicate_rows_removed = 0
    dataset = True
    metadata_root_folder = "txma_raw_stage_metadata"
    row_num = "row_num"
    df_process_counter = 0
    df_raw_row_count = 0
    df_raw_post_dedupliation_row_count = 0

    for df_raw in dfs:
        df_process_counter += 1
        print(f"processing dataframe chunk: {df_process_counter}")

        # Record the start time
        start_time = time.time()

        if not isinstance(df_raw, pd.DataFrame):
            print("No raw records returned for processing. Program is stopping.")
            return

        if df_raw.empty:
            print("No raw records returned for processing. Program is stopping.")
            return

        df_raw_row_count = int(len(df_raw))

        df_raw = remove_columns(preprocessing, json_data, df_raw)
        if df_raw is None:
            raise ValueError(f"Function: remove_columns returned None.")

        # Remove row duplicates
        df_raw = remove_row_duplicates(preprocessing, json_data, df_raw)
        if df_raw is None:
            raise ValueError(f"Function: remove_row_duplicates returned None.")

        if df_raw.empty:
            print(
                "No raw records returned for processing following duplicate row removal. Program is stopping."
            )
            return
        # print(df_raw)

        df_raw_post_dedupliation_row_count = int(len(df_raw))
        cummulative_duplicate_rows_removed = cummulative_duplicate_rows_removed + (
            df_raw_row_count - df_raw_post_dedupliation_row_count
        )

        # Remove rows with missing mandatory field values
        df_raw = remove_rows_missing_mandatory_values(preprocessing, json_data, df_raw)
        if df_raw is None:
            raise ValueError(
                f"Function: remove_rows_missing_mandatory_values returned None."
            )

        if df_raw.empty:
            print(
                "No raw records returned for processing following missing mandatory fields row removal. Program is stopping."
            )
            return
        # print(df_raw)

        # Extract a list of column names from the original df_raw dataframe
        df_raw_col_names_original = list(df_raw.columns)
        if row_num in df_raw_col_names_original:
            df_raw_col_names_original.remove(row_num)
        print(f"df_raw cols: {df_raw_col_names_original}")

        # Rename column(s)
        df_raw = rename_column_names(preprocessing, json_data, df_raw)
        if df_raw is None:
            raise ValueError(f"Function: rename_column_names returned None.")

        if df_raw.empty:
            print(
                "No raw records returned for processing following rename of columns. Program is stopping."
            )
            return
        # print(df_raw)

        # New column(s)
        df_raw = add_new_column(preprocessing, json_data, df_raw)
        if df_raw is None:
            raise ValueError(f"Function: add_new_column returned None.")

        if df_raw.empty:
            print(
                "No raw records returned for processing following adding of new columns. Program is stopping."
            )
            return
        # print(df_raw)

        # New column(s) from struct
        df_raw = add_new_column_from_struct(preprocessing, json_data, df_raw)
        if df_raw is None:
            raise ValueError(f"Function: add_new_column_from_struct returned None.")

        if df_raw.empty:
            print(
                "No raw records returned for processing following adding of new columns from struct. Program is stopping."
            )
            return
        # print(df_raw)

        # Empty string replacement with sql null
        df_raw = empty_string_to_null(preprocessing, json_data, df_raw)
        if df_raw is None:
            raise ValueError(f"Function: empty_string_to_null returned None.")

        if df_raw.empty:
            print(
                "No raw records returned for processing following replacement of empty strings with null. Program is stopping."
            )
            return
        print(
            f"rows to be ingested into the Stage layer from dataframe df_raw: {len(df_raw)}"
        )
        cummulative_stage_table_rows_inserted = (
            cummulative_stage_table_rows_inserted + int(len(df_raw))
        )

        # Generate dtypes - for stage table
        stage_schema_columns = extract_element_by_name(
            json_data, "columns", "stage_schema"
        )
        if stage_schema_columns is None:
            raise ValueError(
                "dtypes value for stage_schema is not found within config rules"
            )
        print(f"stage layer schema:\n{json.dumps(stage_schema_columns, indent=4)}")

        # Retrieve partition columns - for stage table
        stage_schema_partition_columns = extract_element_by_name(
            json_data, "partition_columns", "stage_schema"
        )
        if stage_schema_partition_columns is None:
            raise ValueError(
                "partition columns value for stage_schema is not found within config rules"
            )
        print(f"stage layer partition column: {stage_schema_partition_columns}")

        # Generate dtypes - for key/value table
        stage_key_value_schema_columns = extract_element_by_name(
            json_data, "columns", "key_value_schema"
        )
        if stage_key_value_schema_columns is None:
            raise ValueError(
                "dtypes value for key_value_schema is not found within config rules"
            )
        print(
            f"stage layer key/value schema:\n{json.dumps(stage_key_value_schema_columns, indent=4)}"
        )

        # Generate key/value pairs
        df_keys = generate_key_value_records(
            preprocessing,
            json_data,
            df_raw,
            stage_key_value_schema_columns,
            df_raw_col_names_original,
        )

        if df_keys is None:
            raise ValueError(f"Function: generate_key_value_records returned None.")

        if df_keys.empty:
            print(
                "No raw records returned for processing following the generation of key/value records. Program is stopping."
            )
            return
        print(
            f"rows to be ingested into the Stage layer key/value table from dataframe df_keys: {len(df_keys)}"
        )
        cummulative_stage_key_rows_inserted = cummulative_stage_key_rows_inserted + int(
            len(df_keys)
        )

        # Retrieve partition columns - for stage table
        stage_key_value_schema_partition_columns = extract_element_by_name(
            json_data, "partition_columns", "key_value_schema"
        )
        if stage_key_value_schema_partition_columns is None:
            raise ValueError(
                "partition columns value for key_value_schema is not found within config rules"
            )
        print(
            f"stage layer key/value partition column: {stage_key_value_schema_partition_columns}"
        )

        # Generate list object with column names only
        # Enables selecting specific columns from df_raw
        # Extract column names as list
        stage_select_col_names_list = list(stage_schema_columns.keys())
        df_raw = df_raw[stage_select_col_names_list]

        # write to glue database
        # 1. Key/value table
        # 2. Stage table
        try:
            stage_bucket = args["stage_bucket"]
            stage_target_table = args["stage_target_table"]
            stage_target_key_value_table = args["stage_target_key_value_table"]

            stage_key_value_update = glue_app.write_to_glue_table(
                df_keys,
                f"s3://{stage_bucket}/{stage_target_key_value_table}/",
                dataset,
                args["stage_database"],
                insert_mode,
                args["stage_target_key_value_table"],
                stage_key_value_schema_columns,
                stage_key_value_schema_partition_columns,
            )

            if not stage_key_value_update:
                sys.exit(
                    "Update to stage key/value table did not return boolean(True) response"
                )

            # write Glue table insert metadata to S3
            http_response = s3_app.write_json(
                stage_bucket,
                f'{metadata_root_folder}/{stage_target_key_value_table}/{datetime.now().strftime("%Y%m%d")}/raw_stage_metadata_{datetime.now().strftime("%Y%m%d%H%M%S")}.json',
                json.dumps(stage_key_value_update),
            )
            if http_response is None:
                sys.exit(
                    "Insert of stage key/value table metadata returned invalid response"
                )

            stage_table_update = glue_app.write_to_glue_table(
                df_raw,
                f"s3://{stage_bucket}/{stage_target_table}/",
                dataset,
                args["stage_database"],
                insert_mode,
                args["stage_target_table"],
                stage_schema_columns,
                stage_schema_partition_columns,
            )
            if not stage_table_update:
                sys.exit("Update to stage table did not return boolean(True) response")

            # write Glue table insert metadata to S3
            http_response = s3_app.write_json(
                stage_bucket,
                f'{metadata_root_folder}/{stage_target_table}/{datetime.now().strftime("%Y%m%d")}/raw_stage_metadata_{datetime.now().strftime("%Y%m%d%H%M%S")}.json',
                json.dumps(stage_table_update),
            )
            if http_response is None:
                sys.exit("Insert of stage table metadata returned invalid response")

        except Exception as e:
            print(f"Exception Error writing to Stage layer: {str(e)}")

        # Record the end time
        end_time = time.time()

        # Calculate the elapsed time in seconds
        elapsed_time = end_time - start_time

        # Convert the elapsed time to minutes
        elapsed_minutes = elapsed_time / 60

        # Print the result
        print(
            f"Time taken to process dataframe {df_process_counter}: {elapsed_minutes:.2f} minutes"
        )

        # Release dataframe memory
        del df_raw
        del df_keys

        gc.collect()  # Explicitly trigger garbage collection
        print(f"stage layer successfully updated")
        print(
            f"total stage table records inserted: {cummulative_stage_table_rows_inserted}"
        )
        print(
            f"total stage key table records inserted: {cummulative_stage_key_rows_inserted}"
        )
        print(f"total duplicate rows removed: {cummulative_duplicate_rows_removed}")


def get_raw_data(glue_app, raw_database, raw_sql, athena_query_chunksize):
    dfs = glue_app.query_glue_table(raw_database, raw_sql, athena_query_chunksize)
    if dfs is None:
        raise ValueError(
            f"Function: query_glue_table returned None.  Using query {str(raw_sql)}"
        )
    return dfs
