import pytest
from unittest.mock import MagicMock, patch
import pandas as pd
from raw_to_stage_etl.util import database_utilities
from raw_to_stage_etl.util.exceptions.util_exceptions import QueryException

from raw_to_stage_etl.util.database_utilities import (
    get_all_previous_processed_dts,
    get_min_timestamp_from_previous_run,
    get_all_processed_times_per_day,
    get_max_timestamp,
    get_max_processed_dt,
    get_max_processed_dt_when_table_doesnt_exist,
    get_max_processed_dt_when_table_exists,
)

@pytest.fixture
def glue_client_mock():
    return MagicMock()

@pytest.fixture
def sample_df():
    return pd.DataFrame({"processed_dt": [20240101, 20240102], "processed_time": [101, 102], "timestamp": [1234567890, 1234567891]})

def test_get_all_previous_processed_dts_success(glue_client_mock, sample_df):
    glue_client_mock.does_glue_table_exist.return_value = True
    glue_client_mock.query_glue_table.return_value = [sample_df[["processed_dt"]]]
    result = get_all_previous_processed_dts(glue_client_mock, "db", "table", 20240102, 20240103)
    assert isinstance(result, pd.DataFrame)
    assert "processed_dt" in result.columns

def test_get_all_previous_processed_dts_none_return(glue_client_mock):
    glue_client_mock.does_glue_table_exist.return_value = True
    glue_client_mock.query_glue_table.return_value = None
    with pytest.raises(QueryException):
        get_all_previous_processed_dts(glue_client_mock, "db", "table", 20240102, 20240103)

def test_get_min_timestamp_from_previous_run_single_process(glue_client_mock, sample_df):
    daily_processes_df = pd.DataFrame({"processed_time": [101]})
    glue_client_mock.does_glue_table_exist.return_value = True
    glue_client_mock.query_glue_table.return_value = [pd.DataFrame({"timestamp": [1234567890]})]
    with patch("raw_to_stage_etl.util.database_utilities.get_max_timestamp", return_value=1234567890) as mock_get_max_timestamp:
        result = get_min_timestamp_from_previous_run(
            daily_processes_df, glue_client_mock, "db", "table", 20240102, 20240101
        )
        assert result == 1234567890
        mock_get_max_timestamp.assert_called_with(glue_client_mock, "db", "table", 20240101)


def test_get_min_timestamp_from_previous_run_multiple_processes(glue_client_mock):
    daily_processes_df = pd.DataFrame({"processed_time": [101, 102]})
    glue_client_mock.does_glue_table_exist.return_value = True
    with patch("raw_to_stage_etl.util.database_utilities.get_max_timestamp", return_value=1234567891) as mock_get_max_timestamp:
        result = get_min_timestamp_from_previous_run(
            daily_processes_df, glue_client_mock, "db", "table", 20240102, 20240101
        )
        assert result == 1234567891
        mock_get_max_timestamp.assert_called_with(glue_client_mock, "db", "table", 20240102, 102)

def test_get_min_timestamp_from_previous_run_exception(glue_client_mock):
    daily_processes_df = pd.DataFrame({"processed_time": [101]})
    glue_client_mock.does_glue_table_exist.side_effect = Exception("fail")
    with pytest.raises(QueryException):
        get_min_timestamp_from_previous_run(
            daily_processes_df, glue_client_mock, "db", "table", 20240102, 20240101
        )

def test_get_all_processed_times_per_day_success(glue_client_mock, sample_df):
    glue_client_mock.does_glue_table_exist.return_value = True
    glue_client_mock.query_glue_table.return_value = [sample_df[["processed_time"]]]
    result = get_all_processed_times_per_day(glue_client_mock, "db", "table", 20240102)
    assert isinstance(result, pd.DataFrame)
    assert "processed_time" in result.columns

def test_get_all_processed_times_per_day_none_return(glue_client_mock):
    glue_client_mock.does_glue_table_exist.return_value = True
    glue_client_mock.query_glue_table.return_value = None
    with pytest.raises(QueryException):
        get_all_processed_times_per_day(glue_client_mock, "db", "table", 20240102)

def test_get_max_timestamp_success(glue_client_mock):
    df = pd.DataFrame({"timestamp": [1234567890]})
    glue_client_mock.does_glue_table_exist.return_value = True
    glue_client_mock.query_glue_table.return_value = [df]
    result = get_max_timestamp(glue_client_mock, "db", "table", 20240102, 101)
    assert result == 1234567890

def test_get_max_timestamp_no_table(glue_client_mock):
    glue_client_mock.does_glue_table_exist.return_value = False
    result = get_max_timestamp(glue_client_mock, "db", "table")
    assert result == 0

def test_get_max_timestamp_none_return(glue_client_mock):
    glue_client_mock.does_glue_table_exist.return_value = True
    glue_client_mock.query_glue_table.return_value = None
    with pytest.raises(QueryException):
        get_max_timestamp(glue_client_mock, "db", "table")

def test_get_max_processed_dt_table_exists(glue_client_mock):
    glue_client_mock.does_glue_table_exist.return_value = True
    with patch("raw_to_stage_etl.util.database_utilities.get_max_processed_dt_when_table_exists", return_value="20240101"):
        result = get_max_processed_dt(glue_client_mock, "raw_db", "raw_table", "stage_db", "stage_table")
        assert result == "20240101"

def test_get_max_processed_dt_table_not_exists(glue_client_mock):
    glue_client_mock.does_glue_table_exist.return_value = False
    with patch("raw_to_stage_etl.util.database_utilities.get_max_processed_dt_when_table_doesnt_exist", return_value="20231231"):
        result = get_max_processed_dt(glue_client_mock, "raw_db", "raw_table", "stage_db", "stage_table")
        assert result == "20231231"

def test_get_max_processed_dt_when_table_doesnt_exist_success(glue_client_mock):
    df = pd.DataFrame({"processed_dt": [20240101]})
    glue_client_mock.query_glue_table.return_value = [df]
    result = get_max_processed_dt_when_table_doesnt_exist(glue_client_mock, "raw_db", "raw_table")
    assert result == "20231231" 

def test_get_max_processed_dt_when_table_doesnt_exist_none(glue_client_mock):
    glue_client_mock.query_glue_table.return_value = None
    with pytest.raises(ValueError):
        get_max_processed_dt_when_table_doesnt_exist(glue_client_mock, "raw_db", "raw_table")

def test_get_max_processed_dt_when_table_exists_success(glue_client_mock):
    df = pd.DataFrame({"processed_dt": [20240101]})
    glue_client_mock.query_glue_table.return_value = [df]
    result = get_max_processed_dt_when_table_exists(glue_client_mock, "stage_db", "stage_table")
    assert result == "20240101"

def test_get_max_processed_dt_when_table_exists_none(glue_client_mock):
    glue_client_mock.query_glue_table.return_value = None
    with pytest.raises(ValueError):
        get_max_processed_dt_when_table_exists(glue_client_mock, "stage_db", "stage_table")
