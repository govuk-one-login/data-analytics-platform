"""Module for querying glue tables."""

from pyspark.sql import SparkSession
from pyspark.sql.functions import col
from pyspark.sql.types import *
import boto3

from ..logging.logger import get_logger


class GlueTableQueryAndWrite:
    """A class for querying the Glue Data Catalog tables using native Spark."""

    def __init__(self, args):
        """
        Initialize an instance of the GlueTableQueryAndWrite class.

        This class provides methods for querying and writing to AWS Glue tables.

        Parameters:
         args (dict): Glue job arguments
        """
        self.args = args
        self.logger = get_logger(__name__)
        self.spark = SparkSession.getActiveSession()
        if self.spark is None:
            self.spark = SparkSession.builder.appName("RawToStageETL").getOrCreate()
        self.glue_client = boto3.client('glue')

    def does_glue_table_exist(self, database, table):
        """
        Check if a table exists in the Glue Data Catalog.

        Args:
            database (str): The name of the database to check.
            table (str): The name of the table to check.

        Returns:
            bool: True if the table exists, False otherwise.
        """
        try:
            self.glue_client.get_table(DatabaseName=database, Name=table)
            return True
        except self.glue_client.exceptions.EntityNotFoundException:
            return False
        except Exception as e:
            self.logger.error("Error querying glue data catalog: %s", str(e))
            return None

    def query_glue_table_single(self, database, query):
        """
        Execute a query on a Glue table using Spark SQL and return a single DataFrame.
        Used by database utilities functions.

        Args:
            database (str): The name of the database to run a query against.
            query (str): The SQL query to execute.

        Returns:
            pd.DataFrame: Single Pandas DataFrame result, or None if an error occurs.
        """
        try:
            # Set the database context
            self.spark.sql(f"USE {database}")
            
            # Execute the query
            df = self.spark.sql(query)
            
            # Convert to Pandas DataFrame for compatibility with existing code
            pandas_df = df.toPandas()
            return pandas_df
            
        except Exception as e:
            self.logger.error("Error reading Athena table: %s", str(e))
            return None

    def query_glue_table(self, database, query, chunksize=1):
        """
        Execute a query on a Glue table using Spark SQL.

        Args:
            database (str): The name of the database to run a query against.
            query (str): The SQL query to execute.
            chunksize (int): No. of records to return per dataframe chunk
                                default 1 if no value provided.

        Returns:
            list: List containing a single Pandas DataFrame for compatibility with existing code.
        """
        try:
            # Set the database context
            self.spark.sql(f"USE {database}")
            
            # Execute the query
            df = self.spark.sql(query)
            
            # Convert to Pandas DataFrame for compatibility with existing code
            pandas_df = df.toPandas()
            
            # Return as list for compatibility with existing iterator-based code
            return [pandas_df]
            
        except Exception as e:
            self.logger.error("Error reading Athena table: %s", str(e))
            return None

    def write_to_glue_table(
        self,
        dataframe,
        s3_path,
        dataset,
        database,
        insert_mode,
        table,
        dtype,
        partition_cols,
    ):
        """
        Write a Pandas DataFrame to a Glue table in the AWS Glue Data Catalog.

        Parameters:
            dataframe (pd.DataFrame): The Pandas DataFrame to write to the table.
            s3_path (str): The S3 path where the data will be stored.
            dataset (str): If True store a parquet dataset instead of a ordinary file.
            database (str): The name of the Glue database where the table is located.
            insert_mode (str): The insertion mode (e.g., 'overwrite', 'append') for writing data to the table.
            table (str): The name of the table to write data into.
            dtype (dict, optional): A dictionary specifying the data types of columns.
            partition_cols (list, optional): A list of column names to be used as partition keys.

        Returns:
            Returns S3 path metadata if the write operation is successful, or returns None if there is an error.
        """
        try:
            # Convert pandas DataFrame to Spark DataFrame
            spark_df = self.spark.createDataFrame(dataframe)
            
            # Apply data types if specified
            if dtype:
                for col_name, col_type in dtype.items():
                    if col_name in spark_df.columns:
                        if col_type == 'string':
                            spark_df = spark_df.withColumn(col_name, col(col_name).cast(StringType()))
                        elif col_type == 'bigint':
                            spark_df = spark_df.withColumn(col_name, col(col_name).cast(LongType()))
                        elif col_type == 'int':
                            spark_df = spark_df.withColumn(col_name, col(col_name).cast(IntegerType()))
                        elif col_type == 'double':
                            spark_df = spark_df.withColumn(col_name, col(col_name).cast(DoubleType()))
                        elif col_type == 'timestamp':
                            spark_df = spark_df.withColumn(col_name, col(col_name).cast(TimestampType()))
            
            # Write DataFrame to S3 as Parquet
            writer = spark_df.write.mode(insert_mode).format("parquet")
            
            # Add partitioning if specified
            if partition_cols:
                writer = writer.partitionBy(*partition_cols)
            
            # Write to S3
            writer.save(s3_path)
            
            # Use Glue context to create/update catalog table
            from awsglue.dynamicframe import DynamicFrame
            
            # Convert back to DynamicFrame for catalog operations
            dyf = DynamicFrame.fromDF(spark_df, self.spark.sparkContext._jsc.sc(), "dyf")
            
            # Write to Glue catalog
            self.spark._jsparkSession.catalog().refreshTable(f"{database}.{table}")
            
            # Return metadata dictionary similar to awswrangler format
            return {
                "paths": [s3_path],
                "partitions_values": {},
                "table": table,
                "database": database
            }
            
        except Exception as e:
            self.logger.error("Error writing to Athena table: %s", str(e))
            return None

    def get_raw_data(self, sql_query, athena_query_chunksize):
        """Query Raw Glue table using query string.

        Parameters
         sql_query(str): Query string
         athena_query_chunksize(int): Athena query chunksize

        Returns
         dfs(List of Pandas dataframes):
        """
        self.logger.info("running query %s", sql_query)

        dfs = self.query_glue_table(self.args["raw_database"], sql_query, athena_query_chunksize)
        if dfs is None:
            raise ValueError(f"Function: query_glue_table returned None.  Using query {str(sql_query)}")

        return dfs
