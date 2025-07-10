from unittest.mock import MagicMock, patch

import pandas as pd
import pytest
from raw_to_stage_etl.strategies.strategy import Strategy


class TestStrategy(Strategy):
    """Concrete implementation of Strategy for testing."""

    def extract(self):
        return [pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"]})]


@pytest.fixture
def mock_glue_client():
    return MagicMock()


@pytest.fixture
def mock_s3_client():
    return MagicMock()


@pytest.fixture
def mock_preprocessing():
    return MagicMock()


@pytest.fixture
def sample_config():
    return {
        "stage_schema": {"columns": {"id": "int", "name": "string"}},
        "key_value_schema": {"columns": {"event_id": "string", "key": "string", "value": "string"}, "partition_columns": ["processed_dt"]},
    }


@pytest.fixture
def strategy(mock_glue_client, mock_s3_client, mock_preprocessing, sample_config):
    args = {"stage_bucket": "test-bucket"}
    return TestStrategy(args, sample_config, mock_glue_client, mock_s3_client, mock_preprocessing)


@pytest.fixture
def sample_df():
    return pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", "Bob", "Charlie"], "event_id": ["e1", "e2", "e3"]})


@patch("raw_to_stage_etl.strategies.strategy.extract_element_by_name_and_validate")
@patch("raw_to_stage_etl.strategies.strategy.DataPreprocessingWrapper")
def test_transform_success(mock_wrapper_class, mock_extract, strategy, sample_df):
    # Mock the wrapper instance and its methods
    mock_wrapper = MagicMock()
    mock_wrapper_class.return_value = mock_wrapper

    # Configure wrapper methods to return the same DataFrame (no errors)
    mock_wrapper.remove_columns_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.remove_row_duplicates_with_errors.return_value = sample_df
    mock_wrapper.remove_rows_missing_mandatory_values_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.rename_column_names_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.add_new_column_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.add_new_column_from_struct_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.empty_string_to_null_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.duplicate_column_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.get_all_errors.return_value = pd.DataFrame()  # No errors

    # Mock extract_element_by_name_and_validate calls
    mock_extract.side_effect = [
        {"id": "int", "name": "string"},  # stage_schema columns
        {"event_id": "string", "key": "string", "value": "string"},  # key_value_schema columns
    ]

    # Mock preprocessing.generate_key_value_records_by_json_config
    strategy.preprocessing.generate_key_value_records_by_json_config.return_value = pd.DataFrame(
        {"event_id": ["e1", "e2"], "key": ["name", "id"], "value": ["Alice", "1"]}
    )

    result = strategy.transform(sample_df)

    assert len(result) == 6  # New format with error_df
    df_stage, df_key_values, error_df, duplicate_rows_removed, stage_table_rows_inserted, stage_key_rows_inserted = result

    assert isinstance(df_stage, pd.DataFrame)
    assert isinstance(df_key_values, pd.DataFrame)
    assert isinstance(error_df, pd.DataFrame)
    assert error_df.empty  # No errors in this test
    assert isinstance(duplicate_rows_removed, int)
    assert isinstance(stage_table_rows_inserted, int)
    assert isinstance(stage_key_rows_inserted, int)


@patch("raw_to_stage_etl.strategies.strategy.extract_element_by_name_and_validate")
@patch("raw_to_stage_etl.strategies.strategy.DataPreprocessingWrapper")
def test_transform_with_errors(mock_wrapper_class, mock_extract, strategy, sample_df):
    # Mock the wrapper instance
    mock_wrapper = MagicMock()
    mock_wrapper_class.return_value = mock_wrapper

    # Configure wrapper methods to return DataFrames
    mock_wrapper.remove_columns_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.remove_row_duplicates_with_errors.return_value = sample_df
    mock_wrapper.remove_rows_missing_mandatory_values_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.rename_column_names_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.add_new_column_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.add_new_column_from_struct_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.empty_string_to_null_by_json_config_with_errors.return_value = sample_df
    mock_wrapper.duplicate_column_by_json_config_with_errors.return_value = sample_df

    # Mock errors being collected
    error_df = pd.DataFrame({"id": [99], "_transformation_error": ["Test error"]})
    mock_wrapper.get_all_errors.return_value = error_df

    # Mock extract_element_by_name_and_validate calls
    mock_extract.side_effect = [
        {"id": "int", "name": "string"},
        {"event_id": "string", "key": "string", "value": "string"},
    ]

    # Mock preprocessing method
    strategy.preprocessing.generate_key_value_records_by_json_config.return_value = pd.DataFrame({"event_id": ["e1"], "key": ["name"], "value": ["Alice"]})

    result = strategy.transform(sample_df)

    df_stage, df_key_values, returned_error_df, duplicate_rows_removed, stage_table_rows_inserted, stage_key_rows_inserted = result

    assert not returned_error_df.empty
    assert len(returned_error_df) == 1
    assert returned_error_df.iloc[0]["_transformation_error"] == "Test error"


def test_transform_empty_dataframe(strategy):
    empty_df = pd.DataFrame()

    with pytest.raises(Exception):  # Should raise NoDataFoundException
        strategy.transform(empty_df)


def test_transform_none_dataframe(strategy):
    with pytest.raises(Exception):  # Should raise NoDataFoundException
        strategy.transform(None)
