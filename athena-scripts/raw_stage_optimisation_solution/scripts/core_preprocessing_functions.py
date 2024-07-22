from datetime import datetime, timedelta

def get_max_processed_dt(app, raw_database, raw_source_table, stage_database, stage_target_table, stage_table_exists):

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
        
        if stage_table_exists:
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

    
def extract_element_by_name(json_data, element_name, parent_name=None):

    """
    Extract an element from a JSON data structure by name, optionally matching a parent name.

    Parameters:
    json_data (dict or list): The JSON data structure to search.
    element_name (str): The name of the element to extract.
    parent_name (str, optional): The name of the parent element to match, if applicable.

    Returns:
    Any: The extracted element, or None if not found.
    """

    try:

        if not isinstance(json_data, (dict, list)):
            raise ValueError("Invalid JSON data provided")

        if isinstance(json_data, dict):
            if parent_name is None:
                if element_name in json_data:
                    return json_data[element_name]
            elif parent_name in json_data and element_name in json_data[parent_name]:
                return json_data[parent_name][element_name]
            
            for key, value in json_data.items():
                if isinstance(value, (dict, list)):
                    result = extract_element_by_name(value, element_name, parent_name)
                    if result is not None:
                        return result
        elif isinstance(json_data, list):
            for item in json_data:
                if isinstance(item, (dict, list)):
                    result = extract_element_by_name(item, element_name, parent_name)
                    if result is not None:
                        return result

        return None
    
    except Exception as e:
        print(f"Exception Error retrieving config rule value: {str(e)}")
        return None
    
    
def generate_raw_select_filter(json_data, database, table, filter_processed_dt, stage_table_exists):

    """
    Generate a SQL select criteria for the raw data-set based on JSON configuration.

    Parameters:
    json_data (dict or list): The JSON configuration data.
    database (str): The name of the database.
    table (str): The name of the table.
    filter_processed_dt (int): The processed_dt value for filtering.

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
            deduplicate_subquery = deduplicate_subquery + f'where {event_processing_testing_criteria_filter}'
            sql = f'select * from ({deduplicate_subquery}) where row_num = 1'
        elif event_processing_selection_criteria_filter is not None:
            update_process_dt = event_processing_selection_criteria_filter.replace('processed_dt', str(filter_processed_dt))

            if not stage_table_exists:
                deduplicate_subquery = deduplicate_subquery + f'where {update_process_dt}'
                sql = f'select * from ({deduplicate_subquery}) where row_num = 1'
            else:
                sql = sql + f' where {update_process_dt}'
            
            if event_processing_selection_criteria_limit is not None and event_processing_selection_criteria_limit > 0:
                sql = sql + f' limit {event_processing_selection_criteria_limit}'

        return sql

    except Exception as e:
        print(f"Exception Error retrieving config rule value: {str(e)}")
        return None
    

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
        