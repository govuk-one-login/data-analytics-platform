"""Module to handle transformation errors and write failed records to S3."""

from datetime import datetime

import pandas as pd

from ..logging.logger import get_logger


class ErrorHandler:
    """A class for handling transformation errors and writing failed records to S3."""

    def __init__(self, s3_client, stage_bucket):
        """
        Initialize ErrorHandler.

        Parameters:
        s3_client: S3ReadWrite client instance
        stage_bucket (str): S3 bucket name for storing error files
        """
        self.s3_client = s3_client
        self.stage_bucket = stage_bucket
        self.logger = get_logger(__name__)
        self.failed_records = []

    def add_failed_records(self, error_df):
        """
        Add failed records to the collection.

        Parameters:
        error_df (DataFrame): DataFrame containing failed transformation records
        """
        if not error_df.empty:
            self.failed_records.append(error_df)
            self.logger.info(f"Added {len(error_df)} failed records to error collection")

    def write_failed_records_to_s3(self):
        """
        Combine all failed records and write to S3.

        Returns:
        bool: True if successful, False otherwise
        """
        try:
            if not self.failed_records:
                self.logger.info("No failed records to write to S3")
                return True

            # Combine all failed DataFrames
            combined_errors = pd.concat(self.failed_records, ignore_index=True)

            # Add metadata with single datetime call
            now = datetime.now()
            combined_errors["error_timestamp"] = now.isoformat()
            combined_errors["error_batch_id"] = now.strftime("%Y%m%d_%H%M%S")

            # Convert to JSON
            error_json = combined_errors.to_json(orient="records", date_format="iso")

            # Generate S3 key
            error_key = f"transformation-errors/{now.strftime('%Y/%m/%d')}/errors_{now.strftime('%Y%m%d_%H%M%S')}.json"

            # Write to S3
            response = self.s3_client.write_json(self.stage_bucket, error_key, error_json)

            if response:
                self.logger.info(f"Successfully wrote {len(combined_errors)} failed records to S3: s3://{self.stage_bucket}/{error_key}")
                return True
            else:
                self.logger.error("Failed to write error records to S3")
                return False

        except Exception as e:
            self.logger.error(f"Error writing failed records to S3: {str(e)}")
            return False

    def get_failed_record_count(self):
        """
        Get total count of failed records.

        Returns:
        int: Total number of failed records
        """
        if not self.failed_records:
            return 0
        return sum(len(df) for df in self.failed_records)
