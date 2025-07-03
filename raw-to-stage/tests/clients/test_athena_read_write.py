import pytest
from unittest import mock
from raw_to_stage_etl.clients.athena_read_write import AthenaReadWrite

@pytest.fixture
def athena_client_mock():
    with mock.patch("raw_to_stage_etl.clients.athena_read_write.boto3.client") as boto_client_mock:
        yield boto_client_mock

@pytest.fixture
def logger_mock():
    with mock.patch("raw_to_stage_etl.clients.athena_read_write.get_logger") as logger_mock:
        yield logger_mock

@pytest.fixture
def athena_read_write(athena_client_mock, logger_mock):
    logger_instance = mock.Mock()
    logger_mock.return_value = logger_instance

    athena_instance = mock.Mock()
    athena_client_mock.return_value = athena_instance

    return AthenaReadWrite(args={})

def test_run_query_success(athena_read_write):
    athena_client = athena_read_write.athena_client

    athena_client.start_query_execution.return_value = {"QueryExecutionId": "test-id"}

    athena_client.get_query_execution.return_value = {
        "QueryExecution": {"Status": {"State": "SUCCEEDED"}}
    }

    with mock.patch("time.sleep"):
        result = athena_read_write.run_query("db", "SELECT 1", "wg")
    assert result is True
    athena_read_write.logger.info.assert_called_with("Athena query successfully completed")

def test_run_query_failed(athena_read_write):
    athena_client = athena_read_write.athena_client

    athena_client.start_query_execution.return_value = {"QueryExecutionId": "test-id"}
    athena_client.get_query_execution.return_value = {
        "QueryExecution": {"Status": {"State": "FAILED"}}
    }

    with mock.patch("time.sleep"):
        result = athena_read_write.run_query("db", "SELECT 1", "wg")
    assert result is False
    athena_read_write.logger.info.assert_called_with("Error running Athena query. Status: %s", "FAILED")

def test_run_query_cancelled(athena_read_write):
    athena_client = athena_read_write.athena_client

    athena_client.start_query_execution.return_value = {"QueryExecutionId": "test-id"}
    athena_client.get_query_execution.return_value = {
        "QueryExecution": {"Status": {"State": "CANCELLED"}}
    }

    with mock.patch("time.sleep"):
        result = athena_read_write.run_query("db", "SELECT 1", "wg")
    assert result is False
    athena_read_write.logger.info.assert_called_with("Error running Athena query. Status: %s", "CANCELLED")

def test_run_query_multiple_polls_then_success(athena_read_write):
    athena_client = athena_read_write.athena_client

    athena_client.start_query_execution.return_value = {"QueryExecutionId": "test-id"}
    athena_client.get_query_execution.side_effect = [
        {"QueryExecution": {"Status": {"State": "RUNNING"}}},
        {"QueryExecution": {"Status": {"State": "SUCCEEDED"}}},
    ]

    with mock.patch("time.sleep"):
        result = athena_read_write.run_query("db", "SELECT 1", "wg")
    assert result is True
    athena_read_write.logger.info.assert_called_with("Athena query successfully completed")

def test_run_query_exception(athena_read_write):
    athena_client = athena_read_write.athena_client

    athena_client.start_query_execution.side_effect = Exception("Some error")

    result = athena_read_write.run_query("db", "SELECT 1", "wg")
    assert result is False
    athena_read_write.logger.error.assert_called()
