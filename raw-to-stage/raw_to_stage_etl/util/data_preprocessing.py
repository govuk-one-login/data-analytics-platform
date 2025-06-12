"""Module to perform preprocessing transformation functions on Pandas dataframe."""

from datetime import datetime

import numpy as np
import pandas as pd

from ..exceptions.no_data_found_exception import NoDataFoundException
from ..logging.logger import get_logger
from .exceptions.util_exceptions import OperationFailedException
from .json_config_processing_utilities import extract_element_by_name

INVALID_FIELD_LIST_STRUCTURE = "Invalid field list structure provided, require list object"
INVALID_JSON_ERROR = "Invalid JSON data provided"


def add_new_column_from_struct(df, fields):
    """
    Create new columns from struct fields in the DataFrame.

    Parameters:
    df (DataFrame): The input DataFrame.
    fields (dict): A dictionary where keys are the new column names,
        and values are the corresponding struct fields to extract.

    Returns:
    DataFrame: A DataFrame with new columns added from struct fields.
    """
    try:
        if not isinstance(fields, dict):
            raise ValueError("Invalid field list structure provided, require dict object")

        for key, value in fields.items():
            for item in value:
                col_name = f"{key}_{item}"
                df[col_name] = df.apply(
                    lambda x, k=key, i=item: None if x[k] is None or x[k].get(i) is None or (not x[k].get(i).strip()) else x[k].get(i),
                    axis=1,
                )

        return df
    except Exception as e:
        raise OperationFailedException("Error adding new columns from struct: %s", str(e))


def empty_string_to_null(df, fields):
    """
    Replace empty strings with None (null) in the specified columns.

    Parameters:
    df (DataFrame): The input DataFrame.
    fields (list): A list of column names where empty strings should be replaced with None.

    Returns:
    DataFrame: A DataFrame with empty strings replaced by None.
    """
    try:
        if not isinstance(fields, list):
            raise ValueError(INVALID_FIELD_LIST_STRUCTURE)

        for column_name in fields:
            df[column_name] = df[column_name].apply(lambda x: None if isinstance(x, str) and (x.isspace() or not x) else x)

        return df
    except Exception as e:
        raise OperationFailedException("Error replacing empty string with sql nulls: %s", str(e))


def remove_duplicate_rows(df, fields):
    """
    Remove duplicate rows based on the specified fields.

    Parameters:
    df (DataFrame): The input DataFrame.
    fields (list): A list of column names to consider when identifying duplicates.

    Returns:
    DataFrame: A DataFrame with duplicates removed.
    """
    try:
        if not isinstance(fields, list):
            raise ValueError(INVALID_FIELD_LIST_STRUCTURE)
        return df.drop_duplicates(subset=fields)
    except Exception as e:
        raise OperationFailedException("Error dropping row duplicates: %s", str(e))


def remove_rows_missing_mandatory_values(df, fields):
    """
    Remove rows with missing mandatory field values.

    Parameters:
    df (DataFrame): The input DataFrame.
    fields (list): A list of column names with mandatory values.

    Returns:
    DataFrame: A DataFrame with rows containing mandatory values.
    """
    try:
        if not isinstance(fields, list):
            raise ValueError(INVALID_FIELD_LIST_STRUCTURE)
        return df.dropna(subset=fields)
    except Exception as e:
        raise OperationFailedException("Error dropping rows missing mandatory field: %s", str(e))


def rename_column_names(df, fields):
    """
    Rename column names based on the provided mapping.

    Parameters:
    df (DataFrame): The input DataFrame.
    fields (dict): A dictionary where keys are old column names, and values are new column names.

    Returns:
    DataFrame: A DataFrame with renamed columns.
    """
    try:
        if not isinstance(fields, dict):
            raise ValueError(INVALID_FIELD_LIST_STRUCTURE)
        return df.rename(columns=fields)
    except Exception as e:
        raise OperationFailedException("Error renaming columns: %s", str(e))


def remove_columns(df, columns, silent):
    """
    Remove columns from the data frame.

    Parameters:
    df (DataFrame): The input DataFrame.
    columns (list): A list of columns
    silent (bool): true if errors should be suppressed

    Returns:
    DataFrame: A DataFrame with specified columns removed if found.
    """
    try:
        errors = "ignore" if silent else "raise"
        if not isinstance(columns, list):
            raise ValueError("Invalid field of columns provided, require list")
        return df.drop(columns, axis=1, errors=errors)
    except Exception as e:
        raise OperationFailedException("Error removing columns: %s", str(e))


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
            raise NoDataFoundException("No filter process time found, ending process")

        return int(daily_processes_df["processed_time"].iloc[0])
    except Exception as e:
        raise OperationFailedException(f"Error Retrieving max timestamp: {str(e)}")


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
            raise NoDataFoundException("No penultimate processed dt, ending process")

        return int(all_processed_dts["processed_dt"].iloc[0])
    except Exception as e:
        raise OperationFailedException(f"Exception Error retrieving max timestamp: {str(e)}")


def convert_value_to_float_or_int(value):
    """Typecast object into float or int.

    Parameters:
     value(str/float/int) : value to be converted

    Returns
     converted value
    """
    if isinstance(value, str):  # Check if item is a string
        try:
            value = float(value)  # Attempt to convert the string to a float
        except ValueError:
            pass  # Ignore if conversion fails
    if isinstance(value, (int, float)):
        try:
            if isinstance(value, float) and value.is_integer():
                value = int(value)
        except ValueError:
            pass  # Ignore if conversion fails
    return value


class DataPreprocessing:
    """A class for performing preprocessing tasks against a supplied dataframe."""

    def __init__(self, args):
        """Initialise variables.

        Parameters:
         args (dict): Glue job args
        """
        self.now = datetime.now()
        self.processed_dt = int(self.now.strftime("%Y%m%d"))
        self.processed_time = int(self.now.strftime("%H%M%S"))
        self.logger = get_logger(__name__)

    def add_duplicate_column(self, df, fields):
        """
        Add new duplicate columns to the DataFrame.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (dict): A dictionary where keys are new column names, and values are the columns to duplicate.

        Returns:
        DataFrame: A DataFrame with new duplicated columns added.
        """
        try:
            if not isinstance(fields, dict):
                raise ValueError("Invalid field list structure provided, require dict object")
            for column_name, _value in fields.items():
                df[column_name] = df[_value]

            return df
        except Exception as e:
            raise OperationFailedException("Error adding duplicate column(s): %s", str(e))

    def add_new_column(self, df, fields):
        """
        Add new columns to the DataFrame.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (dict): A dictionary where keys are new column names, and values are their corresponding values.

        Returns:
        DataFrame: A DataFrame with new columns added.
        """
        try:
            if not isinstance(fields, dict):
                raise ValueError("Invalid field list structure provided, require dict object")
            for column_name, _value in fields.items():
                if column_name == "processed_dt":
                    df[column_name] = self.processed_dt
                if column_name == "processed_time":
                    df[column_name] = self.processed_time
            return df
        except Exception as e:
            raise OperationFailedException("Error adding new columns: %s", str(e))

    def extract_key_values(self, obj, parent_key="", sep=".", field_name=""):
        """
        Generate Key/Value records for provided object.

        Parameters:
        obj (dict, primitive (i.e. str, int): The input to extract key-value pairs from (can be of any type)
        parent_key (str): The parent key used for recursion.
        sep (str): The separator used to join parent and child keys.
        field_name (str): Name of the field from the raw df, that the input obj is associated to

        Returns:
        list: A list of (key, value) pairs generated from the input obj argument.
        """
        try:
            items = []
            if not isinstance(obj, (dict, list)):
                items.append((field_name, obj))
            else:
                for key, value in obj.items():
                    if value is None:
                        continue
                    else:
                        self.extract_key_values_from_list_or_dict(items, key, parent_key, sep, value)
            return items

        except Exception as e:
            raise OperationFailedException("Error extracting key/value: %s", str(e))

    def extract_key_values_from_list_or_dict(self, items, key, parent_key, sep, value):
        """Extract key value pairs from list or dict object.

        Parameters:
         items (list): A list of (key, value) pairs
         key (str): key used to form new key in key value pair
         parent_key (str): The parent key used for recursion.
         sep (str): The separator used to join parent and child keys.
         value (dict/list/ndarray/str/int/float):

        Returns:
         None
        """
        new_key = f"{parent_key}{sep}{key}" if parent_key else key
        if isinstance(value, dict):
            items.extend(self.extract_key_values(value, new_key))
        elif isinstance(value, (list, np.ndarray)):
            for i, item in enumerate(value):
                if isinstance(item, (dict, list)):
                    items.extend(self.extract_key_values(item, f"{new_key}[{i}]"))
                else:
                    items.append((f"{new_key}[{i}]", item))
        else:
            value = convert_value_to_float_or_int(value)
            items.append((new_key, value))

    def generate_key_value_records(self, df, fields, column_names_list):
        """Generate Key/Value records from nested struct fields in the DataFrame.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (list): A list of column names with nested struct fields to extract.
        column_names_list (list): A list of column names for the resulting DataFrame.

        Returns:
        DataFrame: A DataFrame with extracted Key/Value records from nested struct fields.
        """
        try:
            if not isinstance(fields, list):
                raise ValueError(INVALID_FIELD_LIST_STRUCTURE)

            # Initialize an empty list to store DataFrames
            dfs = []

            for column_name in fields:
                df_key_value = df.apply(
                    lambda row, col=column_name: (
                        [(row["event_id"], col, key, value) for key, value in self.extract_key_values(row[col], field_name=col)] if pd.notna(row[col]) else []
                    ),
                    axis=1,
                )
                dfs.append(df_key_value)

            self.logger.info("class: DataPreprocessing | method=generate_key_value_records | dfs row count: %s", len(dfs))

            key_value_pairs = pd.concat(dfs, ignore_index=True)

            # Flatten the list of lists into a single list
            key_value_pairs = [item for sublist in key_value_pairs for item in sublist]

            # Create the "extensions_key_values" DataFrame
            result_df = pd.DataFrame(
                key_value_pairs,
                columns=["event_id", "parent_column_name", "key", "value"],
            )

            # Filter out rows with null values
            result_df = result_df[result_df["value"].notna()]
            result_df["processed_dt"] = self.processed_dt
            result_df["processed_time"] = self.processed_time
            result_df.columns = column_names_list

            return result_df
        except Exception as e:
            raise OperationFailedException("Error generating key/value records: %s", str(e))

    def generate_key_value_records_by_json_config(
        self,
        json_data,
        df_raw,
        key_value_schema_columns,
        df_raw_col_names_original,
    ):
        """
        Generate key/value pairs in a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.
        key_value_schema_columns (dict): A dictionary specifying column names for the resulting DataFrame.
        df_raw_col_names_original: Original list of raw layer column names

        Returns:
        DataFrame: The DataFrame with key/value pairs extracted from the raw DataFrame.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_transformations_key_value_cols_exclusion_list = extract_element_by_name(
                json_data,
                "key_value_record_generation_column_exclusion_list",
                "data_transformations",
            )
            if data_transformations_key_value_cols_exclusion_list is None:
                raise ValueError("generate_key_value_records value for data_transformations is not found within config rules")
            self.logger.info(
                "config rule: data_transformations | key_value_record_generation_column_exclusion_list: %s", data_transformations_key_value_cols_exclusion_list
            )

            # Extract column names as list
            col_names_list = list(key_value_schema_columns.keys())

            # Generate a set of column names to generate key/value record(s)
            # Logic: df_raw original column names minus the key/value exclusion columns list
            #        convert set to list object to aid processing
            process_columns_set = set(df_raw_col_names_original) - set(data_transformations_key_value_cols_exclusion_list)
            process_columns_list = list(process_columns_set)
            self.logger.info("key/value records to be created for the following columns: %s", process_columns_list)

            df_keys = self.generate_key_value_records(df_raw, process_columns_list, col_names_list)
            if df_keys is None or df_keys.empty:
                raise ValueError("Class: preprocessing method: extract_key_values returned None/Empty object")
            return df_keys

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function generate_key_value_records: {str(e)}")

    def remove_columns_by_json_config(self, json_data, df_raw):
        """
        Remove columns based on configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.

        Returns:
        DataFrame: The data frame with columns removed
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_cleaning_columns_removal_list = extract_element_by_name(json_data, "remove_columns", "data_cleaning")
            if data_cleaning_columns_removal_list is None:
                raise ValueError("remove_columns value for data_cleaning is not found within config rules")
            self.logger.info("config rule: data cleaning | remove_columns: %s", data_cleaning_columns_removal_list)

            result_df = remove_columns(df_raw, data_cleaning_columns_removal_list, True)
            if result_df is None:
                raise ValueError("Function: remove_columns returned None.")
            else:
                return result_df
        except Exception as e:
            raise OperationFailedException(f"Error removing columns: {str(e)}")

    def remove_row_duplicates(self, json_data, df_raw):
        """
        Remove duplicate rows from a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.

        Returns:
        DataFrame: The DataFrame with duplicate rows removed.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_cleaning_duplicate_row_removal_criteria_fields = extract_element_by_name(json_data, "duplicate_row_removal_criteria_fields", "data_cleaning")
            if data_cleaning_duplicate_row_removal_criteria_fields is None:
                raise ValueError("duplicate_row_removal_criteria_fields value for data_cleaning is not found within config rules")
            self.logger.info("config rule: data_cleaning | duplicate_row_removal_criteria_fields: %s", data_cleaning_duplicate_row_removal_criteria_fields)

            df_raw = remove_duplicate_rows(df_raw, data_cleaning_duplicate_row_removal_criteria_fields)
            if df_raw is None:
                raise ValueError("Function: remove_duplicate_rows returned None object")
            elif df_raw.empty:
                raise ValueError("No raw records returned for processing following duplicate row removal. Program is stopping.")
            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function remove_row_duplicates: {str(e)}")

    def remove_rows_missing_mandatory_values_by_json_config(self, json_data, df_raw):
        """
        Remove rows with missing mandatory field values from a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.

        Returns:
        DataFrame: The DataFrame with rows containing mandatory values.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_cleaning_mandatory_row_removal_criteria_fields = extract_element_by_name(json_data, "mandatory_row_removal_criteria_fields", "data_cleaning")
            if data_cleaning_mandatory_row_removal_criteria_fields is None:
                raise ValueError("mandatory_row_removal_criteria_fields value for data_cleaning is not found within config rules")
            self.logger.info("config rule: data_cleaning | mandatory_row_removal_criteria_fields: %s", data_cleaning_mandatory_row_removal_criteria_fields)

            df_raw = remove_rows_missing_mandatory_values(df_raw, data_cleaning_mandatory_row_removal_criteria_fields)
            if df_raw is None:
                raise ValueError("Function: remove_rows_missing_mandatory_values returned None object")
            elif df_raw.empty:
                raise ValueError("No raw records returned for processing following missing mandatory fields row removal. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function remove_rows_missing_mandatory_values: {str(e)}")

    def rename_column_names_by_json_config(self, json_data, df_raw):
        """
        Rename column names in a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.

        Returns:
        DataFrame: The DataFrame with renamed columns.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_transformations_rename_column = extract_element_by_name(json_data, "rename_column", "data_transformations")
            if data_transformations_rename_column is None:
                self.logger.info("rename_column value for data_transformations is not found within config rules")
                return df_raw
            self.logger.info("config rule: data_transformations | rename_column: %s", data_transformations_rename_column)

            df_raw = rename_column_names(df_raw, data_transformations_rename_column)

            if df_raw is None:
                raise ValueError("Function: rename_column_names returned None object.")
            elif df_raw.empty:
                raise ValueError("No raw records returned for processing following rename of columns. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function rename_column_names: {str(e)}")

    def duplicate_column_by_json_config(self, json_data, df_raw):
        """
        Duplicate column based on existing column to a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.

        Returns:
        DataFrame: The DataFrame with new columns added.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_transformations_dup_column = extract_element_by_name(json_data, "duplicate_column", "data_transformations")
            if data_transformations_dup_column is None:
                raise ValueError("duplicate_column value for data_transformations is not found within config rules")
            self.logger.info("config rule: data_transformations | duplicate_column: %s", data_transformations_dup_column)

            df_raw = self.add_duplicate_column(df_raw, data_transformations_dup_column)

            if df_raw is None:
                raise ValueError("Function: add_duplicate_column returned None object.")
            elif df_raw.empty:
                raise ValueError("No raw records returned for processing following adding of new duplicate columns. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function duplicate_column_by_json_config: {str(e)}")

    def add_new_column_by_json_config(self, json_data, df_raw):
        """
        Add new columns to a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.

        Returns:
        DataFrame: The DataFrame with new columns added.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_transformations_new_column = extract_element_by_name(json_data, "new_column", "data_transformations")
            if data_transformations_new_column is None:
                raise ValueError("new_column value for data_transformations is not found within config rules")
            self.logger.info("config rule: data_transformations | new_column: %s", data_transformations_new_column)

            df_raw = self.add_new_column(df_raw, data_transformations_new_column)

            if df_raw is None:
                raise ValueError("Function: add_new_column returned None object.")
            elif df_raw.empty:
                raise ValueError("No raw records returned for processing following adding of new columns. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function rename_column_names: {str(e)}")

    def add_new_column_from_struct_by_json_config(self, json_data, df_raw):
        """
        Create new columns from struct fields in a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.

        Returns:
        DataFrame: The DataFrame with new columns added from struct fields.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_transformations_new_column_struct_extract = extract_element_by_name(json_data, "new_column_struct_extract", "data_transformations")
            if data_transformations_new_column_struct_extract is None:
                raise ValueError("new_column_struct_extract value for data_transformations is not found within config rules")
            self.logger.info("config rule: data_transformations | new_column_struct_extract: %s", data_transformations_new_column_struct_extract)

            df_raw = add_new_column_from_struct(df_raw, data_transformations_new_column_struct_extract)

            if df_raw is None:
                raise ValueError("Function: add_new_column_from_struct returned None object.")
            elif df_raw.empty:
                raise ValueError("No raw records returned for processing following adding of new columns from struct. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function add_new_column_from_struct: {str(e)}")

    def empty_string_to_null_by_json_config(self, json_data, df_raw):
        """
        Replace empty strings with None (null) in specified columns of a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw DataFrame.

        Returns:
        DataFrame: The DataFrame with empty strings replaced by None.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_cleaning_empty_string_replacement = extract_element_by_name(json_data, "empty_string_replacement", "data_cleaning")
            if data_cleaning_empty_string_replacement is None:
                raise ValueError("empty_string_replacement value for data_cleaning is not found within config rules")
            self.logger.info("config rule: data_cleaning | empty_string_replacement: %s", data_cleaning_empty_string_replacement)

            df_raw = empty_string_to_null(df_raw, data_cleaning_empty_string_replacement)

            if df_raw is None:
                raise ValueError("Function: empty_string_to_null returned None object.")
            elif df_raw.empty:
                raise ValueError("No raw records returned for processing following replacement of empty strings with null. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function add_new_column_from_struct: {str(e)}")
