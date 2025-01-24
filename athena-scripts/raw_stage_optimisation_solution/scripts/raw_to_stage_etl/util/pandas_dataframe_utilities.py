"""Module for functions modifying pandas dataframes."""

from ..exceptions.NoDataFoundException import NoDataFoundException
from .exceptions.UtilExceptions import OperationFailedException

INVALID_FIELD_LIST_STRUCTURE = "Invalid field list structure provided, require list object"


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
