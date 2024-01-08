import json
import sys
import time
import gc
from datetime import datetime

from awsglue.utils import getResolvedOptions
from S3ReadWrite import S3ReadWrite
from GlueTableQueryAndWrite import GlueTableQueryAndWrite
from DataPreprocessing import DataPreprocessing

from core_preprocessing_functions import *


def main():

    # constants
    insert_mode = 'append'
    dataset = True
    metadata_root_folder = 'txma_raw_stage_metadata'
    athena_query_chunksize = 1000000
    df_process_counter = 0
    df_raw_row_count = 0
    df_raw_post_dedupliation_row_count = 0
    cummulative_stage_table_rows_inserted = 0
    cummulative_stage_key_rows_inserted = 0
    cummulative_duplicate_rows_removed = 0


    try:
        
        # Glue Job Inputs
        args = getResolvedOptions(sys.argv,
                          ['JOB_NAME',
                           'config_bucket',
                           'config_key_path',
                           'raw_database',
                           'raw_source_table',
                           'stage_database',
                           'stage_target_table',
                           'stage_target_key_value_table',
                           'stage_bucket'])
        

        # S3 config file reader class
        s3_app = S3ReadWrite()

        # Glue processing class
        glue_app = GlueTableQueryAndWrite()

        # Data transformation class
        preprocessing = DataPreprocessing()
        
        
        # Read config rules json
        json_data = s3_app.read_json(args['config_bucket'], args['config_key_path'])
        if json_data is None:
            raise ValueError("Class 's3_app' returned None, which is not allowed.")
        formatted_json = json.dumps(json_data, indent=4)
        print(f'configuration rules:\n {formatted_json}')
        
        # Query for max(processed_dt)   
        filter_processed_dt = get_max_processed_dt(glue_app,
                                                   args['raw_database'], 
                                                    args['raw_source_table'],
                                                    args['stage_database'],
                                                    args['stage_target_table'])
        
        if filter_processed_dt is None:
            raise ValueError("Function 'get_max_processed_dt' returned None, which is not allowed.")
        print(f'retrieved processed_dt filter value: {filter_processed_dt}')
        
        
        # Generate the raw data select criteria
        raw_sql_select = generate_raw_select_filter(json_data, 
                                                    args['raw_database'], 
                                                    args['raw_source_table'],
                                                    filter_processed_dt)
        
        if raw_sql_select is None:
            raise ValueError("Function 'generate_raw_select_filter' returned None, which is not allowed.")
        print(f'raw layer sql filter: {raw_sql_select}')
        

        # Query raw data
        dfs = glue_app.query_glue_table(args['raw_database'], raw_sql_select, athena_query_chunksize)
        if dfs is None:
            raise ValueError(f"Function: query_glue_table returned None.  Using query {str(raw_sql_select)}")
        
        
        for df_raw in dfs:
            df_process_counter += 1
            print(f'processing dataframe chunk: {df_process_counter}')

            # Record the start time
            start_time = time.time()
        
            if df_raw.empty:
                print("No raw records returned for processing. Program is stopping.")
                return

            df_raw_row_count = int(len(df_raw))
            
            # Remove row duplicates
            df_raw = remove_row_duplicates(preprocessing, json_data, df_raw)
            if df_raw is None:
                raise ValueError(f"Function: remove_row_duplicates returned None.")
            
            if df_raw.empty:
                print("No raw records returned for processing following duplicate row removal. Program is stopping.")
                return
            #print(df_raw)

            df_raw_post_dedupliation_row_count = int(len(df_raw))
            cummulative_duplicate_rows_removed = cummulative_duplicate_rows_removed + (df_raw_row_count - df_raw_post_dedupliation_row_count)

            # Remove rows with missing mandatory field values
            df_raw = remove_rows_missing_mandatory_values(preprocessing, json_data, df_raw)
            if df_raw is None:
                raise ValueError(f"Function: remove_rows_missing_mandatory_values returned None.")
            
            if df_raw.empty:
                print("No raw records returned for processing following missing mandatory fields row removal. Program is stopping.")
                return
            #print(df_raw)

            # Rename column(s)
            df_raw = rename_column_names(preprocessing, json_data, df_raw)
            if df_raw is None:
                raise ValueError(f"Function: rename_column_names returned None.")
            
            if df_raw.empty:
                print("No raw records returned for processing following rename of columns. Program is stopping.")
                return
            #print(df_raw)

            # New column(s)
            df_raw = add_new_column(preprocessing, json_data, df_raw)
            if df_raw is None:
                raise ValueError(f"Function: add_new_column returned None.")
            
            if df_raw.empty:
                print("No raw records returned for processing following adding of new columns. Program is stopping.")
                return
            #print(df_raw)

            # New column(s) from struct
            df_raw = add_new_column_from_struct(preprocessing, json_data, df_raw)
            if df_raw is None:
                raise ValueError(f"Function: add_new_column_from_struct returned None.")
            
            if df_raw.empty:
                print("No raw records returned for processing following adding of new columns from struct. Program is stopping.")
                return
            #print(df_raw)

            # Empty string replacement with sql null
            df_raw = empty_string_to_null(preprocessing, json_data, df_raw)
            if df_raw is None:
                raise ValueError(f"Function: empty_string_to_null returned None.")
            
            if df_raw.empty:
                print("No raw records returned for processing following replacement of empty strings with null. Program is stopping.")
                return
            print(f'rows to be ingested into the Stage layer from dataframe df_raw: {len(df_raw)}')
            cummulative_stage_table_rows_inserted = cummulative_stage_table_rows_inserted + int(len(df_raw))

            # Generate dtypes - for stage table
            stage_schema_columns = extract_element_by_name(json_data, "columns", "stage_schema")
            if stage_schema_columns is None:
                raise ValueError("dtypes value for stage_schema is not found within config rules")
            print(f'stage layer schema:\n{json.dumps(stage_schema_columns, indent=4)}')

            # Generate list object with column names only
            # Enables selecting specific columns from df_raw
            # Extract column names as list
            stage_select_col_names_list = list(stage_schema_columns.keys())
            df_raw = df_raw[stage_select_col_names_list]

            # Retrieve partition columns - for stage table
            stage_schema_partition_columns = extract_element_by_name(json_data, "partition_columns", "stage_schema")
            if stage_schema_partition_columns is None:
                raise ValueError("partition columns value for stage_schema is not found within config rules")
            print(f'stage layer partition column: {stage_schema_partition_columns}')

            # Generate dtypes - for key/value table
            stage_key_value_schema_columns = extract_element_by_name(json_data, "columns", "key_value_schema")
            if stage_key_value_schema_columns is None:
                raise ValueError("dtypes value for key_value_schema is not found within config rules")
            print(f'stage layer key/value schema:\n{json.dumps(stage_key_value_schema_columns, indent=4)}')

            # Generate key/value pairs
            df_keys = generate_key_value_records(preprocessing, json_data, df_raw, stage_key_value_schema_columns)
            if df_keys is None:
                raise ValueError(f"Function: generate_key_value_records returned None.")
            
            if df_keys.empty:
                print("No raw records returned for processing following the generation of key/value records. Program is stopping.")
                return
            print(f'rows to be ingested into the Stage layer key/value table from dataframe df_keys: {len(df_keys)}')
            cummulative_stage_key_rows_inserted = cummulative_stage_key_rows_inserted + int(len(df_keys))

            # Retrieve partition columns - for stage table
            stage_key_value_schema_partition_columns = extract_element_by_name(json_data, "partition_columns", "key_value_schema")
            if stage_key_value_schema_partition_columns is None:
                raise ValueError("partition columns value for key_value_schema is not found within config rules")
            print(f'stage layer key/value partition column: {stage_key_value_schema_partition_columns}')

            ## write to glue database
            #1. Key/value table
            #2. Stage table
            try:
                stage_bucket = args['stage_bucket']
                stage_target_table = args['stage_target_table']
                stage_target_key_value_table = args['stage_target_key_value_table']
                
                stage_key_value_update = glue_app.write_to_glue_table(df_keys,
                                                                f's3://{stage_bucket}/{stage_target_key_value_table}/',
                                                                dataset, 
                                                                args['stage_database'], 
                                                                insert_mode,
                                                                args['stage_target_key_value_table'],
                                                                stage_key_value_schema_columns,
                                                                stage_key_value_schema_partition_columns
                                                                )
                
                if not stage_key_value_update:
                    sys.exit("Update to stage key/value table did not return boolean(True) response")

                # write Glue table insert metadata to S3
                http_response = s3_app.write_json(stage_bucket,
                                                  f'{metadata_root_folder}/{stage_target_key_value_table}/{datetime.now().strftime("%Y%m%d")}/raw_stage_metadata_{datetime.now().strftime("%Y%m%d%H%M%S")}.json',
                                                  json.dumps(stage_key_value_update)
                                                  )
                if http_response is None:
                    sys.exit("Insert of stage key/value table metadata returned invalid response")
                
                stage_table_update = glue_app.write_to_glue_table(df_raw,
                                                            f's3://{stage_bucket}/{stage_target_table}/',
                                                            dataset, 
                                                            args['stage_database'], 
                                                            insert_mode,
                                                            args['stage_target_table'],
                                                            stage_schema_columns,
                                                            stage_schema_partition_columns
                                                            )
                if not stage_table_update:
                    sys.exit("Update to stage table did not return boolean(True) response")

                # write Glue table insert metadata to S3
                http_response = s3_app.write_json(stage_bucket,
                                                  f'{metadata_root_folder}/{stage_target_table}/{datetime.now().strftime("%Y%m%d")}/raw_stage_metadata_{datetime.now().strftime("%Y%m%d%H%M%S")}.json',
                                                  json.dumps(stage_table_update)
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
            print(f"Time taken to process dataframe {df_process_counter}: {elapsed_minutes:.2f} minutes")
            
            # Release dataframe memory
            del df_raw
            del df_keys

            gc.collect()  # Explicitly trigger garbage collection
        
        print(f"stage layer successfully updated")
        print(f"total stage table records inserted: {cummulative_stage_table_rows_inserted}")
        print(f"total stage key table records inserted: {cummulative_stage_key_rows_inserted}")
        print(f"total duplicate rows removed: {cummulative_duplicate_rows_removed}")
        return  #exit program: success

    except ValueError as e:
        print(f"Value Error: {e}")
        sys.exit("Exception encountered within main, exiting process")

    except Exception as e:
        print(f"Exception Error: {str(e)}")
        sys.exit("Exception encountered within main, exiting process")



if __name__ == "__main__":
    main()
