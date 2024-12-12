from datetime import datetime, timedelta

def get_min_timestamp_from_previous_run(daily_processes_df, app, stage_database, stage_target_table, max_processed_dt, penultimate_processed_dt): 
    """
    Get the minimum timestamp to filter for any missing events. This value is taken from the maximum timestamp from the job previous 
    to the last job

    Parameters:
    app (object): An object representing the Glue class.
    raw_database (str): The name of the database containing the raw table.
    raw_source_table (str): The name of the source table in the raw database.
    stage_target_table (str): The name of the target table in the stage database.
    stage_database (str): The name of the database containing the stage_target_table.
    stage_table_exists (bool): True if stage table exists

    Returns:
    int: The maximum timestamp value from the stagetable
    """

    
    try: 
        if daily_processes_df.empty or len(daily_processes_df.index) <= 1:
        # If there are <= 1 processes for a given day, then we need to get the latest timestamp processed from the previous processed day
            max_timestamp = get_max_timestamp(app, stage_database, stage_target_table, penultimate_processed_dt)
            
            print(f'''Retrieved timestamp:{max_timestamp} from date:{penultimate_processed_dt} to filter for missing events''')
            return max_timestamp

        # if there are multiple processes on the day, then get the max timestamp from the process that ran before the last
        processed_time_filter = daily_processes_df['processed_time'].iloc[1]
        max_timestamp = get_max_timestamp(app, stage_database, stage_target_table, max_processed_dt, processed_time_filter)
        print(f'''Retrieved timestamp:{max_timestamp} from date:{max_processed_dt} process time:{processed_time_filter}
              to filter for missing events''')
        
        return max_timestamp
    except Exception as e:
        print(f"Exception Error retrieving max timestamp for reprocess missing events job {str(e)}")
        return None

def get_all_processed_dts(app, stage_database, stage_target_table, max_processed_dt, current_process_dt):
    try:
        if app.does_glue_table_exist(stage_database, stage_target_table):
            sql=f'''select distinct processed_dt as processed_dt
                    from \"{stage_database}\".\"{stage_target_table}$partitions\"
                    where processed_dt not in {max_processed_dt, current_process_dt}
                 '''
                
            sql+=''' order by processed_dt desc'''
            
            print(f'Running query: {sql}')
            dfs = app.query_glue_table(stage_database, sql, 10)
            
            if dfs is None:
                raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")
            
            for df in dfs:
                if 'processed_dt' in df.columns:
                    return df
    except Exception as e:
        print(f"Exception Error retrieving daily processes {str(e)}")
        return None
          
def get_all_processed_times_per_day(app, stage_database, stage_target_table, max_processed_dt, current_process_time=None):
    """
    Get all processes that ran on any given day

    Parameters:
    app (object): An object representing the Glue class.
    stage_target_table (str): The name of the target table in the stage database.
    stage_database (str): The name of the database containing the stage_target_table.
    max_processed_dt(int): The process date to filter for any processes
    current_process_time(int): A value is given if a process is ran on the same day as the last process. 
    Used to disregard the current process as this is not necessary

    Returns:
    df: DataFrame with a list off of all processed_times for a given day
    """
    try:
        if app.does_glue_table_exist(stage_database, stage_target_table):
            sql=f'''select distinct processed_time as processed_time
                    from \"{stage_database}\".\"{stage_target_table}\"
                    where processed_dt={max_processed_dt}
                 '''
                 
            if current_process_time:
                sql+= f''' and processed_time != {current_process_time}'''
                
            sql+=''' order by processed_time desc'''
            
            print(f'Running query: {sql}')
            dfs = app.query_glue_table(stage_database, sql, 10)
            
            if dfs is None:
                raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")
            
            for df in dfs:
                if 'processed_time' in df.columns:
                    return df
    except Exception as e:
        print(f"Exception Error retrieving daily processes {str(e)}")
        return None


def get_last_processed_time(daily_processes_df): 
    """
    Get the maximum processed time from the specified stage table.

    Parameters:
    daily_processes_df (df): dataframe of all processed times for the last processed date

    Returns:
    int: The maximum processed time value from the stage layer table
    """
    
    try:
        if daily_processes_df.empty or daily_processes_df is None:
            return None
        
        return int(daily_processes_df['processed_time'].iloc[0])
    except Exception as e:
        print(f"Exception Error retrieving max timestamp: {str(e)}")
        return None


def get_penultimate_processed_dt(all_processed_dts): 
    """
    Get the penultimate processed dt from the specified stage table.
    last processed dt that isn't current and isn't the last processed dt

    Parameters:
    all_processed_dts (df): dataframe of all processed dates excluding today and the max processed date

    Returns:
    int: The maximum processed time value from the stage layer table
    """
    
    try:
        if all_processed_dts.empty or all_processed_dts is None:
            return None
        
        return int(all_processed_dts['processed_dt'].iloc[0])
    except Exception as e:
        print(f"Exception Error retrieving max timestamp: {str(e)}")
        return None
    
def get_max_timestamp(app, stage_database, stage_target_table, processed_dt=None, processed_time=None):

    """
    Get the maximum timestamp from the specified stage table. filters for specific processes and
    if processed_dt or processed_time are provided

    Parameters:
    app (object): An object representing the Glue class.
    stage_target_table (str): The name of the target table in the stage database.
    stage_database (str): The name of the database containing the stage_target_table.
    processed_dt (int): processed date to filter for
    processed_time (int): processed time to filter for

    Returns:
    int: The maximum timestamp value from the stagetable
    """

    try:
        if app.does_glue_table_exist(stage_database, stage_target_table):
            sql=f'''select max(timestamp) as timestamp
                    from \"{stage_database}\".\"{stage_target_table}\"
                 '''
                 
            if processed_dt and processed_time:
                sql+= f''' where processed_dt={processed_dt} and processed_time={processed_time}'''
            elif processed_dt:
                sql+=f''' where processed_dt={processed_dt}'''
            elif processed_time:
                sql+= f''' where processed_time={processed_time}'''
            print(f'''Running query: {sql}''')

            dfs = app.query_glue_table(stage_database, sql)
            
            if dfs is None:
                raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")
            else:
                for df in dfs:
                    if len(df.index) == 1:
                        if 'timestamp' in df.columns:
                            # The column exists, so you can work with it
                            timestamp = int(df['timestamp'].iloc[0])
                            return timestamp
                        else:
                            raise Exception("Stage table does not contain the timestamp column.")
                
        else:
            return 0
    except Exception as e:
        print(f"Exception Error retrieving max timestamp: {str(e)}")
        return None

def get_max_processed_dt(app, raw_database, raw_source_table, stage_database, stage_target_table):

    """
    Get the maximum processed_dt from the specified stage table.

    Parameters:
    app (object): An object representing the Glue class.
    raw_database (str): The name of the database containing the raw table.
    raw_source_table (str): The name of the source table in the raw database.
    stage_target_table (str): The name of the target table in the stage database.
    stage_database (str): The name of the database containing the stage_target_table.
    stage_table_exists (bool): True if stage table exists

    Returns:
    int: The maximum processed_dt value from the stagetable, 
         or a the min value (from the raw table) if the stage table doesn't exist.
    """

    try:
        
        if app.does_glue_table_exist(stage_database, stage_target_table):
            sql=f'''select max(
			                cast(
				                concat(
					                cast(year as varchar),
					                cast(lpad(cast(month as varchar), 2, '0') as varchar),
					                cast(lpad(cast(day as varchar), 2, '0') as varchar)
				                    ) 
                                as int
			                )
		            ) as processed_dt
                    from \"{stage_database}\".\"{stage_target_table}\"'''
            dfs = app.query_glue_table(stage_database, sql)
            if dfs is None:
                raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")
            else:
                for df in dfs:
                    if len(df.index) == 1:
                        if 'processed_dt' in df.columns:
                            # The column exists, so you can work with it
                            filter_processed_dt = int(df['processed_dt'].iloc[0])
                            return filter_processed_dt
                        else:
                            raise Exception("Stage table does not contain the processed_dt column.")
                
        else:
            # Initial processing activity, so return the min(year,month,day) partition value
            # within the raw layer.
            sql=f'''select min(
                            cast(
                                concat(
                                    cast(year as varchar),
                                    cast(lpad(cast(month as varchar), 2, '0') as varchar),
                                    cast(lpad(cast(day as varchar), 2, '0') as varchar)
                                    ) 
                                as int
                            )
                    ) as processed_dt
                    from \"{raw_database}\".\"{raw_source_table}\"'''
            dfs = app.query_glue_table(raw_database, sql)
            if dfs is None:
                raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")
            else:
                for df in dfs:
                    if len(df.index) == 1:
                        if 'processed_dt' in df.columns:
                            # The column exists, so you can work with it
                            filter_processed_dt = str(df['processed_dt'].iloc[0])
                            # Minus 1 day from value due to filter query being '> processed_dt'
                            date_obj = datetime.strptime(filter_processed_dt, "%Y%m%d")
                            new_date_obj = date_obj - timedelta(days=1)
                            new_filter_processed_dt = new_date_obj.strftime("%Y%m%d")
                            return new_filter_processed_dt
                else:
                    raise Exception("Error returned querying the raw table for the min(year,month,day) value.")

    except Exception as e:
        print(f"Exception Error retrieving max processed_dt: {str(e)}")
        return None

    

def generate_raw_select_filter(json_data, database, table, filter_processed_dt, filter_timestamp):

    """
    Generate a SQL select criteria for the raw data-set based on JSON configuration.

    Parameters:
    json_data (dict or list): The JSON configuration data.
    database (str): The name of the database.
    table (str): The name of the table.
    filter_processed_dt (int): The processed_dt value for filtering.
    filter_timestamp (int): the timestamp for filtering

    Returns:
    str: The SQL select criteria for the raw data-set.
    """

    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        sql = None

        event_processing_selection_criteria_filter = extract_element_by_name(json_data, "filter", "event_processing_selection_criteria")
        if event_processing_selection_criteria_filter is None:
            raise ValueError("filter value for event_processing_selection_criteria is not found within config rules")
        print(f'config rule: event_processing_selection_criteria | filter: {event_processing_selection_criteria_filter}')
        
        event_processing_selection_criteria_limit = extract_element_by_name(json_data, "limit", "event_processing_selection_criteria")
        if event_processing_selection_criteria_limit is None:
            raise ValueError("limit value for event_processing_selection_criteria is not found within config rules")
        print(f'config rule: event_processing_selection_criteria | limit: {event_processing_selection_criteria_limit}')

        event_processing_testing_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_testing_criteria")
        if event_processing_selection_criteria_limit is None:
            raise ValueError("enabled value for event_processing_testing_criteria is not found within config rules")
        print(f'config rule: event_processing_testing_criteria | enabled: {event_processing_testing_criteria_enabled}')

        event_processing_testing_criteria_filter = extract_element_by_name(json_data, "filter", "event_processing_testing_criteria")
        if event_processing_selection_criteria_limit is None:
            raise ValueError("filter value for event_processing_testing_criteria is not found within config rules")
        print(f'config rule: event_processing_testing_criteria | filter: {event_processing_testing_criteria_filter}')
        
        event_processing_view_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_view_criteria")
        if event_processing_view_criteria_enabled is None:
            raise ValueError("enabled value for event_processing_view_criteria is not found within config rules")
        print(f'config rule: event_processing_view_criteria | enabled: {event_processing_view_criteria_enabled}')

        event_processing_view_criteria_view = extract_element_by_name(json_data, "view_name", "event_processing_view_criteria")
        if event_processing_view_criteria_view is None:
            raise ValueError("filter value for event_processing_view_criteria is not found within config rules")
        print(f'config rule: event_processing_view_criteria | view: {event_processing_view_criteria_view}')

        
        deduplicate_subquery = f'''select *,
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
               		    from \"{database}\".\"{table}\" as t '''
                     
        sql = f'''select * from \"{database}\".\"{table}\"'''
        
        if event_processing_view_criteria_enabled and event_processing_view_criteria_view is not None:
            sql = f'select * from \"{database}\".\"{event_processing_view_criteria_view}\"'
        elif event_processing_testing_criteria_enabled and event_processing_testing_criteria_filter is not None:
            deduplicate_subquery = deduplicate_subquery + f' where {event_processing_testing_criteria_filter}'
            sql = f'select * from ({deduplicate_subquery}) where row_num = 1'
        elif event_processing_selection_criteria_filter is not None:
            update_filter = event_processing_selection_criteria_filter.replace('processed_dt', str(filter_processed_dt - 1)).replace('replace_timestamp', str(filter_timestamp))

            sql = sql + f' where {update_filter}'
            
            if event_processing_selection_criteria_limit is not None and event_processing_selection_criteria_limit > 0:
                sql = sql + f' limit {event_processing_selection_criteria_limit}'

        return sql

    except Exception as e:
        print(f"Exception Error retrieving config rule value: {str(e)}")
        return None
    
def generate_missing_event_ids_select_filter(raw_database, stage_layer_database, filter_processed_dt, filter_processed_time, filter_min_timestamp, filter_max_timestamp, penultimate_processed_dt):
    
    """
    Generate select query for events that are missing in the stage layer that haven't been processed in the last run.
    Checks the raw layer for events that have the same event id as any event missing from the stage layers.
    This is done by adding a constraint that is it should match a timestamp range that the last job would have ran.

    Parameters:
    raw_database : raw database
    stage_layer_database: The JSON configuration data.
    filter_processed_dt: date of the latest run
    filter_processed_time: time of the last run
    
    Returns:
    str: The SQL select criteria for the raw data-set.
    """

    return f'''
            SELECT *
            FROM \"{raw_database}\"."txma"
            WHERE event_id IN (
		            SELECT raw.event_id
		            FROM \"{raw_database}\"."txma" raw
			        LEFT OUTER JOIN \"{stage_layer_database}\"."txma_stage_layer" sl ON raw.event_id = sl.event_id
                    AND sl.processed_dt = {filter_processed_dt}
                    AND sl.processed_time = {filter_processed_time}
		            WHERE sl.event_id is null
			        AND CAST(concat(raw.year, raw.month, raw.day) AS INT) >= {penultimate_processed_dt} - 1
			        AND CAST(raw.timestamp as int) > {filter_min_timestamp}
			        AND CAST(raw.timestamp as int) <= {filter_max_timestamp}
	        )
	        AND CAST(concat(year, month, day) AS INT) >= {penultimate_processed_dt} - 1
    '''
def remove_row_duplicates(preprocessing, json_data, df_raw):

    """
    Remove duplicate rows from a DataFrame based on JSON configuration.

    Parameters:
    preprocessing (DataPreprocessing): An instance of the DataPreprocessing class.
    json_data (dict or list): The JSON configuration data.
    df_raw (DataFrame): The raw DataFrame.

    Returns:
    DataFrame: The DataFrame with duplicate rows removed.
    """

    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        data_cleaning_duplicate_row_removal_criteria_fields = extract_element_by_name(json_data, "duplicate_row_removal_criteria_fields", "data_cleaning")
        if data_cleaning_duplicate_row_removal_criteria_fields is None:
            raise ValueError("duplicate_row_removal_criteria_fields value for data_cleaning is not found within config rules")
        print(f'config rule: data_cleaning | duplicate_row_removal_criteria_fields: {data_cleaning_duplicate_row_removal_criteria_fields}')

        df_raw = preprocessing.remove_duplicate_rows(df_raw, data_cleaning_duplicate_row_removal_criteria_fields)
        if df_raw is None:
            raise ValueError("Class: preprocessing method: remove_duplicate_rows returned None object")
        return df_raw
    
    except Exception as e:
        print(f"Exception Error within function remove_row_duplicates: {str(e)}")
        return None
    

def remove_rows_missing_mandatory_values(preprocessing, json_data, df_raw):

    """
    Remove rows with missing mandatory field values from a DataFrame based on JSON configuration.

    Parameters:
    preprocessing (DataPreprocessing): An instance of the DataPreprocessing class.
    json_data (dict or list): The JSON configuration data.
    df_raw (DataFrame): The raw DataFrame.

    Returns:
    DataFrame: The DataFrame with rows containing mandatory values.
    """


    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        data_cleaning_mandatory_row_removal_criteria_fields = extract_element_by_name(json_data, "mandatory_row_removal_criteria_fields", "data_cleaning")
        if data_cleaning_mandatory_row_removal_criteria_fields is None:
            raise ValueError("mandatory_row_removal_criteria_fields value for data_cleaning is not found within config rules")
        print(f'config rule: data_cleaning | mandatory_row_removal_criteria_fields: {data_cleaning_mandatory_row_removal_criteria_fields}')

        df_raw = preprocessing.remove_rows_missing_mandatory_values(df_raw, data_cleaning_mandatory_row_removal_criteria_fields)
        if df_raw is None:
            raise ValueError("Class: preprocessing method: remove_rows_missing_mandatory_values returned None object")
        return df_raw
    
    except Exception as e:
        print(f"Exception Error within function remove_rows_missing_mandatory_values: {str(e)}")
        return None
    

def rename_column_names(preprocessing, json_data, df_raw):

    """
    Rename column names in a DataFrame based on JSON configuration.

    Parameters:
    preprocessing (DataPreprocessing): An instance of the DataPreprocessing class.
    json_data (dict or list): The JSON configuration data.
    df_raw (DataFrame): The raw DataFrame.

    Returns:
    DataFrame: The DataFrame with renamed columns.
    """

    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        data_transformations_rename_column = extract_element_by_name(json_data, "rename_column", "data_transformations")
        if data_transformations_rename_column is None:
            raise ValueError("rename_column value for data_transformations is not found within config rules")
        print(f'config rule: data_transformations | rename_column: {data_transformations_rename_column}')

        df_raw = preprocessing.rename_column_names(df_raw, data_transformations_rename_column)
        if df_raw is None:
            raise ValueError("Class: preprocessing method: rename_column_names returned None object")
        return df_raw
    
    except Exception as e:
        print(f"Exception Error within function rename_column_names: {str(e)}")
        return None
    

def add_new_column(preprocessing, json_data, df_raw):

    """
    Add new columns to a DataFrame based on JSON configuration.

    Parameters:
    preprocessing (DataPreprocessing): An instance of the DataPreprocessing class.
    json_data (dict or list): The JSON configuration data.
    df_raw (DataFrame): The raw DataFrame.

    Returns:
    DataFrame: The DataFrame with new columns added.
    """

    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        data_transformations_new_column = extract_element_by_name(json_data, "new_column", "data_transformations")
        if data_transformations_new_column is None:
            raise ValueError("new_column value for data_transformations is not found within config rules")
        print(f'config rule: data_transformations | new_column: {data_transformations_new_column}')

        df_raw = preprocessing.add_new_column(df_raw, data_transformations_new_column)
        if df_raw is None:
            raise ValueError("Class: preprocessing method: add_new_column returned None object")
        return df_raw
    
    except Exception as e:
        print(f"Exception Error within function rename_column_names: {str(e)}")
        return None
    

def add_new_column_from_struct(preprocessing, json_data, df_raw):

    """
    Create new columns from struct fields in a DataFrame based on JSON configuration.

    Parameters:
    preprocessing (DataPreprocessing): An instance of the DataPreprocessing class.
    json_data (dict or list): The JSON configuration data.
    df_raw (DataFrame): The raw DataFrame.

    Returns:
    DataFrame: The DataFrame with new columns added from struct fields.
    """

    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        data_transformations_new_column_struct_extract = extract_element_by_name(json_data, "new_column_struct_extract", "data_transformations")
        if data_transformations_new_column_struct_extract is None:
            raise ValueError("new_column_struct_extract value for data_transformations is not found within config rules")
        print(f'config rule: data_transformations | new_column_struct_extract: {data_transformations_new_column_struct_extract}')

        df_raw = preprocessing.add_new_column_from_struct(df_raw, data_transformations_new_column_struct_extract)
        if df_raw is None:
            raise ValueError("Class: preprocessing method: add_new_column_from_struct returned None object")
        return df_raw
    
    except Exception as e:
        print(f"Exception Error within function add_new_column_from_struct: {str(e)}")
        return None
    

def empty_string_to_null(preprocessing, json_data, df_raw):

    """
    Replace empty strings with None (null) in specified columns of a DataFrame based on JSON configuration.

    Parameters:
    preprocessing (DataPreprocessing): An instance of the DataPreprocessing class.
    json_data (dict or list): The JSON configuration data.
    df_raw (DataFrame): The raw DataFrame.

    Returns:
    DataFrame: The DataFrame with empty strings replaced by None.
    """

    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        data_cleaning_empty_string_replacement = extract_element_by_name(json_data, "empty_string_replacement", "data_cleaning")
        if data_cleaning_empty_string_replacement is None:
            raise ValueError("empty_string_replacement value for data_cleaning is not found within config rules")
        print(f'config rule: data_cleaning | empty_string_replacement: {data_cleaning_empty_string_replacement}')

        df_raw = preprocessing.empty_string_to_null(df_raw, data_cleaning_empty_string_replacement)
        if df_raw is None:
            raise ValueError("Class: preprocessing method: empty_string_to_null returned None object")
        return df_raw
    
    except Exception as e:
        print(f"Exception Error within function add_new_column_from_struct: {str(e)}")
        return None
    

def generate_key_value_records(preprocessing, json_data, df_raw, key_value_schema_columns, df_raw_col_names_original):

    """
    Generate key/value pairs in a DataFrame based on JSON configuration.

    Parameters:
    preprocessing (DataPreprocessing): An instance of the DataPreprocessing class.
    json_data (dict or list): The JSON configuration data.
    df_raw (DataFrame): The raw DataFrame.
    key_value_schema_columns (dict): A dictionary specifying column names for the resulting DataFrame.
    df_raw_col_names_original: Original list of raw layer column names

    Returns:
    DataFrame: The DataFrame with key/value pairs extracted from the raw DataFrame.
    """
    
    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        data_transformations_key_value_cols_exclusion_list = extract_element_by_name(json_data, "key_value_record_generation_column_exclusion_list", "data_transformations")
        if data_transformations_key_value_cols_exclusion_list is None:
            raise ValueError("generate_key_value_records value for data_transformations is not found within config rules")
        print(f'config rule: data_transformations | key_value_record_generation_column_exclusion_list: {data_transformations_key_value_cols_exclusion_list}')

        # Extract column names as list
        col_names_list = list(key_value_schema_columns.keys())

        # Generate a set of column names to generate key/value record(s)
        # Logic: df_raw original column names minus the key/value exclusion columns list
        #        convert set to list object to aid processing
        process_columns_set = set(df_raw_col_names_original) - set(data_transformations_key_value_cols_exclusion_list)
        process_columns_list = list(process_columns_set)
        print(f"key/value records to be created for the following columns: {process_columns_list}")

        df_keys = preprocessing.generate_key_value_records(df_raw, process_columns_list, col_names_list)
        if df_keys is None:
            raise ValueError("Class: preprocessing method: extract_key_values returned None object")
        return df_keys

    except Exception as e:
        print(f"Exception Error within function generate_key_value_records: {str(e)}")
        return None

def remove_columns(preprocessing, json_data, df_raw):

    """

    remove columns based on configuration
    
    Parameters:
    preprocessing (DataPreprocessing): An instance of the DataPreprocessing class.
    json_data (dict or list): The JSON configuration data.
    df_raw (DataFrame): The raw DataFrame.

    Returns:
    DataFrame: The data frame with columns removed 
    """
        
    try:
        
        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")
        
        data_cleaning_columns_removal_list  = extract_element_by_name(json_data, "remove_columns", "data_cleaning")
        if data_cleaning_columns_removal_list is None:
            raise ValueError("remove_columns value for data_cleaning is not found within config rules")
        print(f'config rule: data cleaning | remove_columns: {data_cleaning_columns_removal_list}')

        return preprocessing.remove_columns(df_raw, data_cleaning_columns_removal_list, True)
    except Exception as e:
        print(f"Error removing columns: {str(e)}")
        return None
        