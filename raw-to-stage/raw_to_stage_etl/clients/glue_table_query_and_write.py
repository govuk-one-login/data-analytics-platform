"""Module for querying glue tables."""

import awswrangler as wr
from pyspark.sql import SparkSession

from ..logging.logger import get_logger

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
        Write a PySpark DataFrame to a Glue table in the AWS Glue Data Catalog.

        Parameters:
            dataframe (pyspark.sql.DataFrame): The PySpark DataFrame to write to the table.
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
            # Convert PySpark DataFrame to Pandas for awswrangler compatibility
            pandas_df = dataframe.toPandas()
            s3_write_data_return_value = wr.s3.to_parquet(
                df=pandas_df,
                path=s3_path,
                dataset=dataset,
                database=database,
                mode=insert_mode,
                table=table,
                dtype=dtype,
                partition_cols=partition_cols,
            )
            return s3_write_data_return_value
        except Exception as e:
            self.logger.error("Error writing to Athena table: %s", str(e))
            return None

    def get_raw_data(self, sql_query, athena_query_chunksize):
        """Query Raw Glue table using query string.

        Returns results as a list of PySpark DataFrames.

        Parameters
         sql_query(str): Query string
         athena_query_chunksize(int): Athena query chunksize

        Returns
         dfs(List of PySpark DataFrames):
        """
        self.logger.info("running query %s", sql_query)

        dfs = self.query_glue_table(self.args["raw_database"], sql_query, athena_query_chunksize)
        if dfs is None:
            raise ValueError(f"Function: query_glue_table returned None.  Using query {str(sql_query)}")

        from pyspark.sql.types import StructType, StructField, StringType

        spark = SparkSession.builder.getOrCreate()
        spark_dfs = []
        for pdf in dfs:
            # Build an all-StringType schema to avoid type merge conflicts
            # (e.g. extensions column may be None in some rows and a parsed dict in others)
            schema = StructType([StructField(col, StringType(), True) for col in pdf.columns])
            # Convert all values to strings, keeping None as None
            for col in pdf.columns:
                pdf[col] = pdf[col].apply(lambda x: str(x) if x is not None and not (isinstance(x, float) and x != x) else None)
            spark_dfs.append(spark.createDataFrame(pdf, schema=schema))

        return spark_dfs
