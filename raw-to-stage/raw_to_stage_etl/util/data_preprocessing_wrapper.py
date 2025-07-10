"""Wrapper methods for DataPreprocessing to handle error collection."""

import pandas as pd

from ..logging.logger import get_logger
from .data_preprocessing import (add_new_column_from_struct, empty_string_to_null, remove_columns,
                                 remove_duplicate_rows, remove_rows_missing_mandatory_values, rename_column_names)
from .json_config_processing_utilities import extract_element_by_name_and_validate


class DataPreprocessingWrapper:
    """Wrapper class to handle error collection for data preprocessing operations."""

    def __init__(self, preprocessing_instance):
        """
        Initialize wrapper with preprocessing instance.

        Parameters:
        preprocessing_instance: DataPreprocessing instance
        """
        self.preprocessing = preprocessing_instance
        self.logger = get_logger(__name__)
        self.error_records = []

    def remove_columns_by_json_config_with_errors(self, config_data, df):
        """Remove columns based on JSON config and collect errors."""
        try:
            columns_to_remove = extract_element_by_name_and_validate(config_data, "columns_to_remove", "data_preprocessing")
            if columns_to_remove:
                success_df, error_df = remove_columns(df, columns_to_remove, silent=True)
                self._collect_errors(error_df)
                return success_df
            return df
        except Exception as e:
            self.logger.error(f"Error in remove_columns_by_json_config_with_errors: {str(e)}")
            return df

    def remove_row_duplicates_with_errors(self, config_data, df):
        """Remove duplicate rows and collect errors."""
        try:
            duplicate_removal_fields = extract_element_by_name_and_validate(config_data, "duplicate_removal_fields", "data_preprocessing")
            if duplicate_removal_fields:
                success_df, error_df = remove_duplicate_rows(df, duplicate_removal_fields)
                self._collect_errors(error_df)
                return success_df
            return df
        except Exception as e:
            self.logger.error(f"Error in remove_row_duplicates_with_errors: {str(e)}")
            return df

    def remove_rows_missing_mandatory_values_by_json_config_with_errors(self, config_data, df):
        """Remove rows with missing mandatory values and collect errors."""
        try:
            mandatory_fields = extract_element_by_name_and_validate(config_data, "mandatory_fields", "data_preprocessing")
            if mandatory_fields:
                success_df, error_df = remove_rows_missing_mandatory_values(df, mandatory_fields)
                self._collect_errors(error_df)
                return success_df
            return df
        except Exception as e:
            self.logger.error(f"Error in remove_rows_missing_mandatory_values_by_json_config_with_errors: {str(e)}")
            return df

    def rename_column_names_by_json_config_with_errors(self, config_data, df):
        """Rename columns and collect errors."""
        try:
            column_rename_mapping = extract_element_by_name_and_validate(config_data, "column_rename_mapping", "data_preprocessing")
            if column_rename_mapping:
                success_df, error_df = rename_column_names(df, column_rename_mapping)
                self._collect_errors(error_df)
                return success_df
            return df
        except Exception as e:
            self.logger.error(f"Error in rename_column_names_by_json_config_with_errors: {str(e)}")
            return df

    def add_new_column_by_json_config_with_errors(self, config_data, df):
        """Add new columns and collect errors."""
        try:
            new_columns = extract_element_by_name_and_validate(config_data, "new_columns", "data_preprocessing")
            if new_columns:
                success_df, error_df = self.preprocessing.add_new_column(df, new_columns)
                self._collect_errors(error_df)
                return success_df
            return df
        except Exception as e:
            self.logger.error(f"Error in add_new_column_by_json_config_with_errors: {str(e)}")
            return df

    def add_new_column_from_struct_by_json_config_with_errors(self, config_data, df):
        """Add new columns from struct and collect errors."""
        try:
            struct_fields = extract_element_by_name_and_validate(config_data, "struct_fields", "data_preprocessing")
            if struct_fields:
                success_df, error_df = add_new_column_from_struct(df, struct_fields)
                self._collect_errors(error_df)
                return success_df
            return df
        except Exception as e:
            self.logger.error(f"Error in add_new_column_from_struct_by_json_config_with_errors: {str(e)}")
            return df

    def empty_string_to_null_by_json_config_with_errors(self, config_data, df):
        """Replace empty strings with null and collect errors."""
        try:
            null_replacement_fields = extract_element_by_name_and_validate(config_data, "null_replacement_fields", "data_preprocessing")
            if null_replacement_fields:
                success_df, error_df = empty_string_to_null(df, null_replacement_fields)
                self._collect_errors(error_df)
                return success_df
            return df
        except Exception as e:
            self.logger.error(f"Error in empty_string_to_null_by_json_config_with_errors: {str(e)}")
            return df

    def duplicate_column_by_json_config_with_errors(self, config_data, df):
        """Duplicate columns and collect errors."""
        try:
            duplicate_columns = extract_element_by_name_and_validate(config_data, "duplicate_columns", "data_preprocessing")
            if duplicate_columns:
                success_df, error_df = self.preprocessing.add_duplicate_column(df, duplicate_columns)
                self._collect_errors(error_df)
                return success_df
            return df
        except Exception as e:
            self.logger.error(f"Error in duplicate_column_by_json_config_with_errors: {str(e)}")
            return df

    def _collect_errors(self, error_df):
        """Collect error records."""
        if not error_df.empty:
            self.error_records.append(error_df)
            self.logger.info(f"Collected {len(error_df)} error records")

    def get_all_errors(self):
        """Get combined error DataFrame."""
        if not self.error_records:
            return pd.DataFrame()
        return pd.concat(self.error_records, ignore_index=True)

    def clear_errors(self):
        """Clear collected error records."""
        self.error_records = []
