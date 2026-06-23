"""Glue job main script."""

import sys
from pyspark.sql import SparkSession
from pyspark.sql.functions import col

from awsglue.utils import getResolvedOptions


def main():
    """Start of the glue job. It controls flow of the whole job."""
    try:
        # Glue Job Inputs
        args = getResolvedOptions(
            sys.argv,
            [
                "JOB_NAME",
                "LOG_LEVEL",
                "config_bucket",
                "config_key_path",
                "txma_raw_dedup_view_key_path",
                "workgroup",
                "raw_database",
                "raw_source_table",
                "stage_database",
                "stage_target_table",
                "stage_target_key_value_table",
                "stage_bucket",
            ],
        )

        # Initialize Spark session
        spark = SparkSession.builder \
            .appName("raw-to-stage-etl") \
            .config("spark.executor.heartbeatInterval", "30s") \
            .config("spark.network.timeout", "600s") \
            .config("spark.sql.hive.metastorePartitionPruning", "true") \
            .config("spark.sql.hive.verifyPartitionPath", "false") \
            .config("spark.sql.sources.partitionOverwriteMode", "dynamic") \
            .getOrCreate()

        # Database and table names
        raw_database = "production-preview-txma-raw"
        raw_table = "txma-refactored"
        
        
        spark.sql(f"USE `production-preview-txma-raw`")

        df = spark.sql(f"""
            SELECT *
            FROM `txma-refactored`
            WHERE datecreated = 'year=2025/month=07/day=05'
            LIMIT 10
        """)

        # Method 2: Using DataFrame API with catalog
        df = spark.read.table(f"`{raw_table}`") \
            .select("*") \
            .limit(1000)

        # Show some info about the data
        row_count = df.count()
        print(f"Query result rows: {row_count}")
        
        if row_count > 0:
            print("Schema:")
            df.printSchema()
            print("First few rows:")
            df.show(5, truncate=False)
            
            # Example processing
            processed_df = df.withColumn("processed_timestamp", col("timestamp"))
        else:
            print("DataFrame is empty - no data returned from query")

        print("Processing complete")
    except Exception as e:
        print(f"Exception encountered: {e}")
        sys.exit("Exception encountered within main, exiting process")
    finally:
        if 'spark' in locals():
            spark.stop()


if __name__ == "__main__":
    main()
