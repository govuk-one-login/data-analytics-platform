from unittest.mock import MagicMock

import pandas as pd
import pytest
from raw_to_stage_etl.processor.processor import RawToStageProcessor


@pytest.fixture
def mock_strategy():
    return MagicMock()


@pytest.fixture
def mock_error_handler():
    return MagicMock()


@pytest.fixture
def processor_with_error_handler(mock_strategy, mock_error_handler):
    return RawToStageProcessor({}, mock_strategy, mock_error_handler)


@pytest.fixture
def processor_without_error_handler(mock_strategy):
    return RawToStageProcessor({}, mock_strategy)


@pytest.fixture
def sample_df():
    return pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"]})


def test_init_with_error_handler(processor_with_error_handler, mock_strategy, mock_error_handler):
    assert processor_with_error_handler.strategy == mock_strategy
    assert processor_with_error_handler.error_handler == mock_error_handler


def test_init_without_error_handler(processor_without_error_handler, mock_strategy):
    assert processor_without_error_handler.strategy == mock_strategy
    assert processor_without_error_handler.error_handler is None


def test_process_old_format_return(processor_without_error_handler, mock_strategy, sample_df):
    # Mock strategy to return old format (5 values)
    mock_strategy.extract.return_value = [sample_df]
    mock_strategy.transform.return_value = (
        sample_df,  # df_stage
        sample_df,  # df_key_values
        0,  # duplicate_rows_removed
        2,  # stage_table_rows_inserted
        2,  # stage_key_rows_inserted
    )
    mock_strategy.load.return_value = None

    # Should not raise exception
    processor_without_error_handler.process()

    mock_strategy.extract.assert_called_once()
    mock_strategy.transform.assert_called_once_with(sample_df)
    mock_strategy.load.assert_called_once()


def test_process_new_format_return_with_error_handler(processor_with_error_handler, mock_strategy, mock_error_handler, sample_df):
    error_df = pd.DataFrame({"id": [99], "_transformation_error": ["Test error"]})

    # Mock strategy to return new format (6 values)
    mock_strategy.extract.return_value = [sample_df]
    mock_strategy.transform.return_value = (
        sample_df,  # df_stage
        sample_df,  # df_key_values
        error_df,  # error_df
        0,  # duplicate_rows_removed
        2,  # stage_table_rows_inserted
        2,  # stage_key_rows_inserted
    )
    mock_strategy.load.return_value = None

    processor_with_error_handler.process()

    # Verify error handler was called with error DataFrame
    mock_error_handler.add_failed_records.assert_called_once_with(error_df)


def test_process_new_format_return_empty_errors(processor_with_error_handler, mock_strategy, mock_error_handler, sample_df):
    empty_error_df = pd.DataFrame()

    # Mock strategy to return new format with empty errors
    mock_strategy.extract.return_value = [sample_df]
    mock_strategy.transform.return_value = (
        sample_df,  # df_stage
        sample_df,  # df_key_values
        empty_error_df,  # error_df (empty)
        0,  # duplicate_rows_removed
        2,  # stage_table_rows_inserted
        2,  # stage_key_rows_inserted
    )
    mock_strategy.load.return_value = None

    processor_with_error_handler.process()

    # Error handler should not be called for empty error DataFrame
    mock_error_handler.add_failed_records.assert_not_called()


def test_process_new_format_return_without_error_handler(processor_without_error_handler, mock_strategy, sample_df):
    error_df = pd.DataFrame({"id": [99], "_transformation_error": ["Test error"]})

    # Mock strategy to return new format (6 values)
    mock_strategy.extract.return_value = [sample_df]
    mock_strategy.transform.return_value = (
        sample_df,  # df_stage
        sample_df,  # df_key_values
        error_df,  # error_df
        0,  # duplicate_rows_removed
        2,  # stage_table_rows_inserted
        2,  # stage_key_rows_inserted
    )
    mock_strategy.load.return_value = None

    # Should not raise exception even with errors but no error handler
    processor_without_error_handler.process()

    mock_strategy.extract.assert_called_once()
    mock_strategy.transform.assert_called_once()
    mock_strategy.load.assert_called_once()


def test_process_multiple_dataframes(processor_with_error_handler, mock_strategy, mock_error_handler, sample_df):
    df2 = pd.DataFrame({"id": [3, 4], "name": ["Charlie", "David"]})
    error_df = pd.DataFrame({"id": [99], "_transformation_error": ["Test error"]})

    # Mock strategy to return multiple DataFrames
    mock_strategy.extract.return_value = [sample_df, df2]
    mock_strategy.transform.side_effect = [
        (sample_df, sample_df, error_df, 0, 2, 2),  # First call with errors
        (df2, df2, pd.DataFrame(), 0, 2, 2),  # Second call without errors
    ]
    mock_strategy.load.return_value = None

    processor_with_error_handler.process()

    # Should be called twice (once for each DataFrame)
    assert mock_strategy.transform.call_count == 2
    assert mock_strategy.load.call_count == 2

    # Error handler should be called once (only first DataFrame had errors)
    mock_error_handler.add_failed_records.assert_called_once_with(error_df)


def test_process_backfill_strategy_no_data(processor_without_error_handler, mock_strategy):
    # Mock BackfillStrategy with no data
    mock_strategy.__class__.__name__ = "BackfillStrategy"
    mock_strategy.extract.return_value = None

    with pytest.raises(Exception):  # Should raise NoDataFoundException
        processor_without_error_handler.process()
