"""Module for S3 read and write."""

import json

import boto3
from aws_lambda_powertools import Logger


class S3ReadWrite:
    """
    A class for reading/writing JSON data from an AWS S3 bucket.

    Methods:
        __init__(self, bucket_name, key_path)
            Initializes a new S3ReadWrite instance.

        read_json(self)
            Reads JSON data from the specified S3 bucket and key path, and returns the parsed JSON data as a Python object.
        write_json(self)
            Writes JSON data to a specified S3 bucket and key path
        read_file(self)
            Reads file data from the specified S3 bucket and key path, and returns the file data as a text object.
    """

    def __init__(self, args):
        """Initialize a new S3ReadWrite instance.

        Parameters:
         args (dict): Glue job arguments
        """
        self.s3 = boto3.client("s3")
        self.logger = Logger(args["LOG_LEVEL"])

    def read_json(self, bucket_name, key_path):
        """
        Read JSON data from the specified S3 bucket and key path, and returns the parsed JSON data as a Python object.

        Returns:
            dict or list: The parsed JSON data as a Python dictionary or list.

        Raises:
            ValueError: If the JSON data is None or empty.
        """
        try:
            response = self.s3.get_object(Bucket=bucket_name, Key=key_path)
            json_data = json.loads(response["Body"].read().decode("utf-8"))
            if json_data is None:
                raise ValueError("return value is None")
            return json_data
        except Exception as e:
            self.logger.error("Error reading JSON from S3: %s", str(e))
            return None

    def write_json(self, bucket_name, key_path, body):
        """
        Write JSON data to a specified S3 bucket and key path.

        Returns:
            HTTP response object

        Raises:
            ValueError: If the HTTP response object is None or empty.
        """
        try:
            response = self.s3.put_object(Bucket=bucket_name, Key=key_path, Body=body)
            if response is None:
                raise ValueError("Put object for S3 metadata return value is None")
            return response
        except Exception as e:
            self.logger.error("Error writing JSON to S3: %s", str(e))
            return None

    def read_file(self, bucket_name, key_path):
        """
        Read file data from the specified S3 bucket and key path, and returns a string object.

        Returns:
            str: The file data as a string object.

        Raises:
            ValueError: If the file data is None or empty.
        """
        try:
            response = self.s3.get_object(Bucket=bucket_name, Key=key_path)
            data = response["Body"].read().decode("utf-8")
            if data is None:
                raise ValueError("return value is None")
            return data
        except Exception as e:
            self.logger.error("Error reading file from S3: %s", str(e))
            return None
