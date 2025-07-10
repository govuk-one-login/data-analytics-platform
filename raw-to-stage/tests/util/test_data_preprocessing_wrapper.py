from unittest.mock import MagicMock, patch

import pandas as pd
import pytest
from raw_to_stage_etl.util.data_preprocessing_wrapper import DataPreprocessingWrapper


@pytest.fixture
def mock_preprocessing():
    return MagicMock()


@pytest.fixture
def wrapper(mock_preprocessing):
    return DataPreprocessingWrapper(mock_preprocessing)


@pytest.fixture
def sample_df():
    return pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"]})


@pytest.fixture
def sample_config():
    return {
        "data_preprocessing": {
            "columns_to_remove": ["col1"],
            "duplicate_removal_fields": ["id"],
            "mandatory_fields": ["name"],
            "column_rename_mapping": {"old": "new"},
            "new_columns": {"processed_dt": None},
            "struct_fields": {"nested": ["value"]},
            "null_replacement_fields": ["name"],
            "duplicate_columns": {"new_col": "existing_col"},
        }
    }


def test_init(wrapper, mock_preprocessing):
    assert wrapper.preprocessing == mock_preprocessing
    assert wrapper.error_records == []


@patch("raw_to_stage_etl.util.data_preprocessing_wrapper.extract_element_by_name_and_validate")
@patch("raw_to_stage_etl.util.data_preprocessing_wrapper.remove_columns")
def test_remove_columns_by_json_config_with_errors(mock_remove_columns, mock_extract, wrapper, sample_df, sample_config):
    mock_extract.return_value = ["col1"]
    mock_remove_columns.return_value = (sample_df, pd.DataFrame())

    result = wrapper.remove_columns_by_json_config_with_errors(sample_config, sample_df)

    pd.testing.assert_frame_equal(result, sample_df)
    mock_remove_columns.assert_called_once_with(sample_df, ["col1"], silent=True)


@patch("raw_to_stage_etl.util.data_preprocessing_wrapper.extract_element_by_name_and_validate")
@patch("raw_to_stage_etl.util.data_preprocessing_wrapper.remove_duplicate_rows")
def test_remove_row_duplicates_with_errors(mock_remove_duplicates, mock_extract, wrapper, sample_df, sample_config):
    mock_extract.return_value = ["id"]
    mock_remove_duplicates.return_value = (sample_df, pd.DataFrame())

    result = wrapper.remove_row_duplicates_with_errors(sample_config, sample_df)

    pd.testing.assert_frame_equal(result, sample_df)
    mock_remove_duplicates.assert_called_once_with(sample_df, ["id"])


@patch("raw_to_stage_etl.util.data_preprocessing_wrapper.extract_element_by_name_and_validate")
@patch("raw_to_stage_etl.util.data_preprocessing_wrapper.remove_rows_missing_mandatory_values")
def test_remove_rows_missing_mandatory_values_by_json_config_with_errors(mock_remove_mandatory, mock_extract, wrapper, sample_df, sample_config):
    mock_extract.return_value = ["name"]
    mock_remove_mandatory.return_value = (sample_df, pd.DataFrame())

    result = wrapper.remove_rows_missing_mandatory_values_by_json_config_with_errors(sample_config, sample_df)

    pd.testing.assert_frame_equal(result, sample_df)
    mock_remove_mandatory.assert_called_once_with(sample_df, ["name"])


def test_collect_errors(wrapper):
    error_df = pd.DataFrame({"id": [1], "error": ["test error"]})
    wrapper._collect_errors(error_df)

    assert len(wrapper.error_records) == 1
    pd.testing.assert_frame_equal(wrapper.error_records[0], error_df)


def test_collect_errors_empty_df(wrapper):
    empty_df = pd.DataFrame()
    wrapper._collect_errors(empty_df)

    assert len(wrapper.error_records) == 0


def test_get_all_errors_empty(wrapper):
    result = wrapper.get_all_errors()
    assert result.empty


def test_get_all_errors_with_data(wrapper):
    error_df1 = pd.DataFrame({"id": [1], "error": ["error1"]})
    error_df2 = pd.DataFrame({"id": [2], "error": ["error2"]})

    wrapper.error_records = [error_df1, error_df2]
    result = wrapper.get_all_errors()

    expected = pd.concat([error_df1, error_df2], ignore_index=True)
    pd.testing.assert_frame_equal(result, expected)


def test_clear_errors(wrapper):
    wrapper.error_records = [pd.DataFrame({"id": [1]})]
    wrapper.clear_errors()

    assert wrapper.error_records == []
