from unittest.mock import MagicMock, patch

import pandas as pd
import pytest
from raw_to_stage_etl.util.error_handler import ErrorHandler


@pytest.fixture
def mock_s3_client():
    return MagicMock()


@pytest.fixture
def error_handler(mock_s3_client):
    return ErrorHandler(mock_s3_client, "test-bucket")


@pytest.fixture
def sample_error_df():
    return pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"], "_transformation_error": ["Error 1", "Error 2"]})


def test_init(error_handler, mock_s3_client):
    assert error_handler.s3_client == mock_s3_client
    assert error_handler.stage_bucket == "test-bucket"
    assert error_handler.failed_records == []


def test_add_failed_records_empty_df(error_handler):
    empty_df = pd.DataFrame()
    error_handler.add_failed_records(empty_df)
    assert len(error_handler.failed_records) == 0


def test_add_failed_records_with_data(error_handler, sample_error_df):
    error_handler.add_failed_records(sample_error_df)
    assert len(error_handler.failed_records) == 1
    pd.testing.assert_frame_equal(error_handler.failed_records[0], sample_error_df)


def test_get_failed_record_count_empty(error_handler):
    assert error_handler.get_failed_record_count() == 0


def test_get_failed_record_count_with_records(error_handler, sample_error_df):
    error_handler.add_failed_records(sample_error_df)
    assert error_handler.get_failed_record_count() == 2


def test_write_failed_records_to_s3_no_records(error_handler):
    result = error_handler.write_failed_records_to_s3()
    assert result is True
    error_handler.s3_client.write_json.assert_not_called()


@patch("raw_to_stage_etl.util.error_handler.datetime")
def test_write_failed_records_to_s3_success(mock_datetime, error_handler, sample_error_df):
    mock_datetime.now.return_value.isoformat.return_value = "2024-01-01T12:00:00"
    mock_datetime.now.return_value.strftime.return_value = "20240101_120000"

    error_handler.s3_client.write_json.return_value = {"ResponseMetadata": {"HTTPStatusCode": 200}}
    error_handler.add_failed_records(sample_error_df)

    result = error_handler.write_failed_records_to_s3()

    assert result is True
    error_handler.s3_client.write_json.assert_called_once()


def test_write_failed_records_to_s3_failure(error_handler, sample_error_df):
    error_handler.s3_client.write_json.return_value = None
    error_handler.add_failed_records(sample_error_df)

    result = error_handler.write_failed_records_to_s3()

    assert result is False


def test_write_failed_records_to_s3_exception(error_handler, sample_error_df):
    error_handler.s3_client.write_json.side_effect = Exception("S3 error")
    error_handler.add_failed_records(sample_error_df)

    result = error_handler.write_failed_records_to_s3()

    assert result is False
