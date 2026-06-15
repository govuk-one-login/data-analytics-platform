"""Module to perform preprocessing transformation functions on PySpark dataframe."""

import json
from datetime import datetime

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StringType

from ..exceptions.no_data_found_exception import NoDataFoundException
from ..logging.logger import get_logger
from .exceptions.util_exceptions import OperationFailedException
from .json_config_processing_utilities import extract_element_by_name

INVALID_FIELD_LIST_STRUCTURE = "Invalid field list structure provided, require list object"
INVALID_JSON_ERROR = "Invalid JSON data provided"


def add_new_column_from_struct(df, fields):
    """
    Create new columns from struct fields in the DataFrame.

    The struct columns are stored as JSON strings. This function uses
    get_json_object to extract the specified keys.

    Parameters:
    df (DataFrame): The input PySpark DataFrame.
    fields (dict): A dictionary where keys are column names containing JSON strings,
        and values are the corresponding fields to extract.

    Returns:
    DataFrame: A DataFrame with new columns added from struct fields.
    """
    try:
        if not isinstance(fields, dict):
            raise ValueError("Invalid field list structure provided, require dict object")

        for key, value in fields.items():
            for item in value:
                col_name = f"{key}_{item}"
                extracted = F.get_json_object(F.col(key), f"$.{item}")
                df = df.withColumn(
                    col_name,
                    F.when(
                        F.col(key).isNull() | extracted.isNull() | (F.trim(extracted) == F.lit("")),
                        F.lit(None).cast(StringType()),
                    ).otherwise(extracted),
                )

        return df
    except Exception as e:
        raise OperationFailedException("Error adding new columns from struct: %s", str(e))


def add_new_column_from_string_format(df, fields):
    """
    Create new columns from formatted string column in the DataFrame.

    Parameters:
    df (DataFrame): The input PySpark DataFrame.
    fields (dict): A dictionary where keys are raw column names which contain unformatted string values
    and the value is a dictionary of keys with new column names and the corresponding regex to extract.

    Returns:
    DataFrame: A DataFrame with new columns added from unformatted fields.
    """
    try:
        if not isinstance(fields, dict):
            raise ValueError("Invalid field list structure provided, require dict object")

        for col, mappings in fields.items():
            for new_col, pattern in mappings.items():
                df = df.withColumn(new_col, F.regexp_extract(F.col(col), pattern, 1))

        return df
    except Exception as e:
        raise OperationFailedException("Error adding new columns from unformatted string: %s", str(e))


def empty_string_to_null(df, fields):
    """
    Replace empty strings with None (null) in the specified columns.

    Parameters:
    df (DataFrame): The input PySpark DataFrame.
    fields (list): A list of column names where empty strings should be replaced with None.

    Returns:
    DataFrame: A DataFrame with empty strings replaced by None.
    """
    try:
        if not isinstance(fields, list):
            raise ValueError(INVALID_FIELD_LIST_STRUCTURE)

        for column_name in fields:
            df = df.withColumn(
                column_name,
                F.when(
                    (F.col(column_name).isNull()) | (F.trim(F.col(column_name)) == F.lit("")),
                    F.lit(None).cast(StringType()),
                ).otherwise(F.col(column_name)),
            )

        return df
    except Exception as e:
        raise OperationFailedException("Error replacing empty string with sql nulls: %s", str(e))


def remove_duplicate_rows(df, fields):
    """
    Remove duplicate rows based on the specified fields.

    Parameters:
    df (DataFrame): The input PySpark DataFrame.
    fields (list): A list of column names to consider when identifying duplicates.

    Returns:
    DataFrame: A DataFrame with duplicates removed.
    """
    try:
        if not isinstance(fields, list):
            raise ValueError(INVALID_FIELD_LIST_STRUCTURE)
        return df.dropDuplicates(subset=fields)
    except Exception as e:
        raise OperationFailedException("Error dropping row duplicates: %s", str(e))


def remove_rows_missing_mandatory_values(df, fields):
    """
    Remove rows with missing mandatory field values.

    Parameters:
    df (DataFrame): The input PySpark DataFrame.
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
    df (DataFrame): The input PySpark DataFrame.
    fields (dict): A dictionary where keys are old column names, and values are new column names.

    Returns:
    DataFrame: A DataFrame with renamed columns.
    """
    try:
        if not isinstance(fields, dict):
            raise ValueError(INVALID_FIELD_LIST_STRUCTURE)
        for old_name, new_name in fields.items():
            if old_name in df.columns:
                df = df.withColumnRenamed(old_name, new_name)
        return df
    except Exception as e:
        raise OperationFailedException("Error renaming columns: %s", str(e))


def remove_columns(df, columns, silent):
    """
    Remove columns from the data frame.

    Parameters:
    df (DataFrame): The input PySpark DataFrame.
    columns (list): A list of columns
    silent (bool): true if errors should be suppressed

    Returns:
    DataFrame: A DataFrame with specified columns removed if found.
    """
    try:
        if not isinstance(columns, list):
            raise ValueError("Invalid field of columns provided, require list")
        if silent:
            columns = [c for c in columns if c in df.columns]
        return df.drop(*columns)
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
    if isinstance(value, str):
        try:
            value = float(value)
        except ValueError:
            pass
    if isinstance(value, (int, float)):
        try:
            if isinstance(value, float) and value.is_integer():
                value = int(value)
        except ValueError:
            pass
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
        df (DataFrame): The input PySpark DataFrame.
        fields (dict): A dictionary where keys are new column names, and values are the columns to duplicate.

        Returns:
        DataFrame: A DataFrame with new duplicated columns added.
        """
        try:
            if not isinstance(fields, dict):
                raise ValueError("Invalid field list structure provided, require dict object")
            for column_name, _value in fields.items():
                df = df.withColumn(column_name, F.col(_value))

            return df
        except Exception as e:
            raise OperationFailedException("Error adding duplicate column(s): %s", str(e))

    def add_new_column(self, df, fields):
        """
        Add new columns to the DataFrame.

        Parameters:
        df (DataFrame): The input PySpark DataFrame.
        fields (dict): A dictionary where keys are new column names, and values are their corresponding values.

        Returns:
        DataFrame: A DataFrame with new columns added.
        """
        try:
            if not isinstance(fields, dict):
                raise ValueError("Invalid field list structure provided, require dict object")
            for column_name, _value in fields.items():
                if column_name == "processed_dt":
                    df = df.withColumn(column_name, F.lit(self.processed_dt))
                if column_name == "processed_time":
                    df = df.withColumn(column_name, F.lit(self.processed_time))
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
         value (dict/list/str/int/float):

        Returns:
         None
        """
        new_key = f"{parent_key}{sep}{key}" if parent_key else key
        if isinstance(value, dict):
            items.extend(self.extract_key_values(value, new_key))
        elif isinstance(value, list):
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

        Uses the cached parsed rows (from parse_string_columns_as_json_by_config) which
        preserve full nested dict structure. Falls back to collecting from the DataFrame
        and parsing JSON strings if cache is unavailable.

        Parameters:
        df (DataFrame): The input PySpark DataFrame.
        fields (list): A list of column names with nested struct fields to extract.
        column_names_list (list): A list of column names for the resulting DataFrame.

        Returns:
        DataFrame: A PySpark DataFrame with extracted Key/Value records from nested struct fields.
        """
        try:
            if not isinstance(fields, list):
                raise ValueError(INVALID_FIELD_LIST_STRUCTURE)

            spark = SparkSession.builder.getOrCreate()
            all_rows = []

            # Use cached parsed rows if available (preserves nested dict structure)
            if hasattr(self, '_parsed_rows_cache') and self._parsed_rows_cache:
                rows_data = self._parsed_rows_cache
            else:
                # Fallback: collect from DataFrame and parse JSON strings
                rows_data = []
                for row in df.collect():
                    row_dict = row.asDict()
                    for col in fields:
                        val = row_dict.get(col)
                        if isinstance(val, str) and val.strip().startswith("{"):
                            row_dict[col] = json.loads(val)
                    rows_data.append(row_dict)

            for row_dict in rows_data:
                event_id = row_dict["event_id"]
                for column_name in fields:
                    cell_value = row_dict.get(column_name)
                    if cell_value is not None:
                        kv_pairs = self.extract_key_values(cell_value, field_name=column_name)
                        for key, value in kv_pairs:
                            all_rows.append((event_id, column_name, key, value))

            self.logger.info("class: DataPreprocessing | method=generate_key_value_records | rows count: %s", len(all_rows))

            # Create PySpark DataFrame from collected key-value pairs
            result_df = spark.createDataFrame(all_rows, ["event_id", "parent_column_name", "key", "value"])

            # Filter out rows with null values
            result_df = result_df.filter(F.col("value").isNotNull())
            result_df = result_df.withColumn("processed_dt", F.lit(self.processed_dt))
            result_df = result_df.withColumn("processed_time", F.lit(self.processed_time))

            # Rename columns to match expected schema
            for i, col_name in enumerate(column_names_list):
                old_name = result_df.columns[i]
                if old_name != col_name:
                    result_df = result_df.withColumnRenamed(old_name, col_name)

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
        df_raw (DataFrame): The raw PySpark DataFrame.
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
            process_columns_set = set(df_raw_col_names_original) - set(data_transformations_key_value_cols_exclusion_list)
            process_columns_list = list(process_columns_set)
            self.logger.info("key/value records to be created for the following columns: %s", process_columns_list)

            df_keys = self.generate_key_value_records(df_raw, process_columns_list, col_names_list)
            if df_keys is None or df_keys.rdd.isEmpty():
                raise ValueError("Class: preprocessing method: extract_key_values returned None/Empty object")
            return df_keys

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function generate_key_value_records: {str(e)}")

    def remove_columns_by_json_config(self, json_data, df_raw):
        """
        Remove columns based on configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.

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
        df_raw (DataFrame): The raw PySpark DataFrame.

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
            elif df_raw.rdd.isEmpty():
                raise ValueError("No raw records returned for processing following duplicate row removal. Program is stopping.")
            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function remove_row_duplicates: {str(e)}")

    def remove_rows_missing_mandatory_values_by_json_config(self, json_data, df_raw):
        """
        Remove rows with missing mandatory field values from a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.

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
            elif df_raw.rdd.isEmpty():
                raise ValueError("No raw records returned for processing following missing mandatory fields row removal. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function remove_rows_missing_mandatory_values: {str(e)}")

    def rename_column_names_by_json_config(self, json_data, df_raw):
        """
        Rename column names in a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.

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
            elif df_raw.rdd.isEmpty():
                raise ValueError("No raw records returned for processing following rename of columns. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function rename_column_names: {str(e)}")

    def duplicate_column_by_json_config(self, json_data, df_raw):
        """
        Duplicate column based on existing column to a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.

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
            elif df_raw.rdd.isEmpty():
                raise ValueError("No raw records returned for processing following adding of new duplicate columns. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function duplicate_column_by_json_config: {str(e)}")

    def add_new_column_by_json_config(self, json_data, df_raw):
        """
        Add new columns to a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.

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
            elif df_raw.rdd.isEmpty():
                raise ValueError("No raw records returned for processing following adding of new columns. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function rename_column_names: {str(e)}")

    def add_new_column_from_struct_by_json_config(self, json_data, df_raw):
        """
        Create new columns from struct fields in a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.

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
            elif df_raw.rdd.isEmpty():
                raise ValueError("No raw records returned for processing following adding of new columns from struct. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function add_new_column_from_struct: {str(e)}")

    def empty_string_to_null_by_json_config(self, json_data, df_raw):
        """
        Replace empty strings with None (null) in specified columns of a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.

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
            elif df_raw.rdd.isEmpty():
                raise ValueError("No raw records returned for processing following replacement of empty strings with null. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function add_new_column_from_struct: {str(e)}")

    def parse_string_columns_as_json_by_config(self, json_data, df_raw):
        """
        Parse columns that are defined as strings into json.

        For PySpark, JSON strings are parsed and stored back as JSON strings in the DataFrame
        (to preserve nested structure). The parsed dicts are stored in self._parsed_json_cache
        for use by generate_key_value_records which needs the full nested structure.
        Columns that don't start with '{' are set to None.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.
        Returns:
        DataFrame: The DataFrame with non-JSON values in parse_json_list columns set to None.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            parse_json_column_list = extract_element_by_name(json_data, "parse_json_list", "data_transformations")
            if parse_json_column_list is None:
                raise ValueError("parse_json_list value for data_cleaning is not found within config rules")
            self.logger.info("config rule: data_transformations | parse_json_strings: %s", parse_json_column_list)

            # Collect rows, parse JSON, and cache parsed dicts for key-value extraction
            spark = SparkSession.builder.getOrCreate()
            rows = df_raw.collect()
            parsed_rows = []
            for row in rows:
                row_dict = row.asDict()
                for col in parse_json_column_list:
                    val = row_dict.get(col)
                    if isinstance(val, str) and val.strip().startswith("{"):
                        row_dict[col] = json.loads(val)
                    else:
                        row_dict[col] = None
                parsed_rows.append(row_dict)

            if not parsed_rows:
                raise ValueError("No raw records returned for processing following replacement of empty strings with null. Program is stopping.")

            # Cache parsed rows for later use by generate_key_value_records
            self._parsed_rows_cache = parsed_rows

            # For the Spark DataFrame, store parsed JSON back as JSON strings
            # This preserves the column in the DataFrame while keeping the schema simple
            spark_rows = []
            for row_dict in parsed_rows:
                spark_row = dict(row_dict)
                for col in parse_json_column_list:
                    val = spark_row.get(col)
                    if val is not None:
                        spark_row[col] = json.dumps(val)
                    else:
                        spark_row[col] = None
                spark_rows.append(spark_row)

            result_df = spark.createDataFrame(spark_rows, schema=df_raw.schema)
            result_df = result_df.select(df_raw.columns)

            return result_df

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function parse_json: {str(e)}")

    def add_new_column_from_formatted_string_by_json_config(self, json_data, df_raw):
        """
        Create new columns from string fields in a DataFrame based on JSON configuration.

        Parameters:
        json_data (dict or list): The JSON configuration data.
        df_raw (DataFrame): The raw PySpark DataFrame.

        Returns:
        DataFrame: The DataFrame with new columns added from struct fields.
        """
        try:
            if not isinstance(json_data, (dict, list)):
                raise ValueError(INVALID_JSON_ERROR)

            data_transformations_new_column_string_extract = extract_element_by_name(json_data, "new_column_string_extract", "data_transformations")
            if data_transformations_new_column_string_extract is None:
                raise ValueError("new_column_string_extract value for data_transformations is not found within config rules")
            self.logger.info("config rule: data_transformations | new_column_string_extract: %s", data_transformations_new_column_string_extract)

            df_raw = add_new_column_from_string_format(df_raw, data_transformations_new_column_string_extract)

            if df_raw is None:
                raise ValueError("Function: data_transformations_new_column_string_extract returned None object.")
            elif df_raw.rdd.isEmpty():
                raise ValueError("No raw records returned for processing following adding of new columns from string format. Program is stopping.")

            return df_raw

        except Exception as e:
            raise OperationFailedException(f"Exception Error within function add_new_column_from_string_format: {str(e)}")

    def filter_null_values_and_null_strings(self, df, column):
        """Remove rows which have null values or null as string('null') in column.

        Parameters:
        df : DataFrame
            Input PySpark dataframe
        column : str
            Column to filter on

        Returns:
        DataFrame
            Filtered dataframe
        """
        return df.filter(F.col(column).isNotNull() & (F.col(column) != F.lit("null")))
