import json

import boto3
import pytest
from moto import mock_aws
from raw_to_stage_etl.clients.s3_read_write import S3ReadWrite
from raw_to_stage_etl.util.exceptions.util_exceptions import OperationFailedException

JSON_DATA = {"name": "sample", "id": "120"}
BUCKET = "SAMPLE_BUCKET"
JSON_S3_KEY = "DATA/sample.json"


class TestGlueTableQueryAndWrite:
    def setup_method(self):
        args = {"LOG_LEVEL": "INFO"}
        self.s3_wrapper = S3ReadWrite(args)

    @mock_aws
    def test_should_read_json_successfully(self):
        s3_client = boto3.client("s3")
        s3_client.create_bucket(Bucket=BUCKET, CreateBucketConfiguration={"LocationConstraint": "eu-west-2"})
        s3_client.put_object(Bucket=BUCKET, Key=JSON_S3_KEY, Body=bytes(json.dumps(JSON_DATA), "utf-8"))
        result = self.s3_wrapper.read_json(BUCKET, JSON_S3_KEY)
        assert result == JSON_DATA

    def test_should_raise_exception_when_unable_to_read_json(self):
        with pytest.raises(OperationFailedException):
            self.s3_wrapper.read_json(BUCKET, JSON_S3_KEY)

    @mock_aws
    def test_should_write_json_successfully(self):
        s3_client = boto3.client("s3")
        s3_client.create_bucket(Bucket=BUCKET, CreateBucketConfiguration={"LocationConstraint": "eu-west-2"})
        result = self.s3_wrapper.write_json(BUCKET, JSON_S3_KEY, bytes(json.dumps(JSON_DATA), "utf-8"))
        assert result["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_should_raise_exception_when_unable_to_write_json(self):
        with pytest.raises(OperationFailedException):
            self.s3_wrapper.write_json(BUCKET, JSON_S3_KEY, bytes(json.dumps(JSON_DATA), "utf-8"))
