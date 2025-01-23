"""Module to perform preprocessing transformation functions on Pandas dataframe."""

import logging
from datetime import datetime

import numpy as np
import pandas as pd
from raw_to_stage_etl.util.exceptions.UtilExceptions import OperationFailedException

from ..logger import logger

INVALID_FIELD_LIST_STRUCTURE = "Invalid field list structure provided, require list object"


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
        self.logger = logging.getLogger(__name__)
        logger.init(args)
        logger.configure(self.logger)

    def remove_duplicate_rows(self, df, fields):
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

    def remove_rows_missing_mandatory_values(self, df, fields):
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

    def rename_column_names(self, df, fields):
        """
        Rename column names based on the provided mapping.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (dict): A dictionary where keys are old column names, and values are new column names.

        Returns:
        DataFrame: A DataFrame with renamed columns.
        """
        try:
            if not isinstance(fields, (dict)):
                raise ValueError(INVALID_FIELD_LIST_STRUCTURE)
            return df.rename(columns=fields)
        except Exception as e:
            raise OperationFailedException("Error renaming columns: %s", str(e))

    def remove_columns(self, df, columns, silent):
        """
        Remove columns from the data frame.

        Parameters:
        df (DataFrame): The input DataFrame.
        columns (list): A list of columns
        silent (bool): true if errors should be supressed

        Returns:
        DataFrame: A DataFrame with specified columns removed if found.
        """
        try:
            errors = "ignore" if silent else "raise"
            if not isinstance(columns, (list)):
                raise ValueError("Invalid field of columns provided, require list")
            return df.drop(columns, axis=1, errors=errors)
        except Exception as e:
            raise OperationFailedException("Error removing columns: %s", str(e))

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

    def add_new_column_from_struct(self, df, fields):
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

    def empty_string_to_null(self, df, fields):
        """
        Replace empty strings with None (null) in the specified columns.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (list): A list of column names where empty strings should be replaced with None.

        Returns:
        DataFrame: A DataFrame with empty strings replaced by None.
        """
        try:
            if not isinstance(fields, (list)):
                raise ValueError(INVALID_FIELD_LIST_STRUCTURE)

            for column_name in fields:
                df[column_name] = df[column_name].apply(lambda x: None if isinstance(x, str) and (x.isspace() or not x) else x)

            return df
        except Exception as e:
            raise OperationFailedException("Error replacing empty string with sql nulls: %s", str(e))

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
