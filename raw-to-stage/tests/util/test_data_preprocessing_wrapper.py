from unittest.mock import MagicMock

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


def test_init(wrapper, mock_preprocessing):
    assert wrapper.preprocessing == mock_preprocessing
    assert wrapper.error_records == []


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
