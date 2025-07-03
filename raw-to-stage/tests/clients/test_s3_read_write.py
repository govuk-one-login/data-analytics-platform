import pytest
from unittest import mock
from io import BytesIO
from raw_to_stage_etl.clients.s3_read_write import S3ReadWrite

@pytest.fixture
def mock_boto3_client():
    with mock.patch("raw_to_stage_etl.clients.s3_read_write.boto3.client") as mock_client:
        yield mock_client

@pytest.fixture
def mock_logger():
    with mock.patch("raw_to_stage_etl.clients.s3_read_write.get_logger") as mock_logger:
        yield mock_logger

@pytest.fixture
def s3rw(mock_boto3_client, mock_logger):
    mock_logger.return_value = mock.Mock()
    return S3ReadWrite(args={})

def test_read_json_success(s3rw):
    mock_body = BytesIO(b'{"foo": "bar"}')
    s3rw.s3.get_object = mock.Mock(return_value={"Body": mock_body})
    result = s3rw.read_json("bucket", "key")
    assert result == {"foo": "bar"}

def test_read_json_none_data(s3rw):
    mock_body = BytesIO(b'null')
    s3rw.s3.get_object = mock.Mock(return_value={"Body": mock_body})
    result = s3rw.read_json("bucket", "key")
    assert result is None

def test_read_json_exception(s3rw):
    s3rw.s3.get_object = mock.Mock(side_effect=Exception("fail"))
    result = s3rw.read_json("bucket", "key")
    assert result is None

def test_write_json_success(s3rw):
    s3rw.s3.put_object = mock.Mock(return_value={"ResponseMetadata": {"HTTPStatusCode": 200}})
    result = s3rw.write_json("bucket", "key", '{"foo": "bar"}')
    assert result == {"ResponseMetadata": {"HTTPStatusCode": 200}}

def test_write_json_none_response(s3rw):
    s3rw.s3.put_object = mock.Mock(return_value=None)
    result = s3rw.write_json("bucket", "key", '{"foo": "bar"}')
    assert result is None

def test_write_json_exception(s3rw):
    s3rw.s3.put_object = mock.Mock(side_effect=Exception("fail"))
    result = s3rw.write_json("bucket", "key", '{"foo": "bar"}')
    assert result is None

def test_read_file_success(s3rw):
    mock_body = BytesIO(b'file content')
    s3rw.s3.get_object = mock.Mock(return_value={"Body": mock_body})
    result = s3rw.read_file("bucket", "key")
    assert result == "file content"

def test_read_file_none_data(s3rw):
    mock_body = BytesIO(b'')
    s3rw.s3.get_object = mock.Mock(return_value={"Body": mock_body})
    result = s3rw.read_file("bucket", "key")
    assert result == ""

def test_read_file_exception(s3rw):
    s3rw.s3.get_object = mock.Mock(side_effect=Exception("fail"))
    result = s3rw.read_file("bucket", "key")
    assert result is None
