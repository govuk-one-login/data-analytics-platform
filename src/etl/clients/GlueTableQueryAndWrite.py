import awswrangler as wr

class GlueTableQueryAndWrite:
    """
        
    A class for querying the Glue Data Catalog tables.

    """
    def __init__(self):
        """
        Initializes an instance of the GlueTableQueryAndWrite class.
        This class provides methods for querying and writing to AWS Glue tables.

        Parameters:
            None
        """
        pass

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
            return wr.catalog.does_table_exist(
                database=database,
                table=table)
        except Exception as e:
            print(f"Error querying glue data catalog: {str(e)}")
            return None
    
    def query_glue_table(self, database, query, chunksize=1):
        """
        Execute a query on a Glue table using Athena.

        Args:
            database (str): The name of the database to run a query against.
            query (str): The SQL query to execute.
            chunksize (int): No. of records to return per dataframe chunk
                                default 1 if no value provided.

        Returns:
            pd.DataFrame: The query result as a Pandas DataFrame, or None if an error occurs.
        """
        try:
            df = wr.athena.read_sql_query(query,
                                          database=database,
                                          chunksize=chunksize)
            return df
        except Exception as e:
            print(f"Error reading Athena table: {str(e)}")
            return None

    def write_to_glue_table(self, dataframe, s3_path, dataset, database, insert_mode, table, dtype, partition_cols):
        """
        Write a Pandas DataFrame to a Glue table in the AWS Glue Data Catalog.

        Args:
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
            s3_write_data_return_value = wr.s3.to_parquet(df=dataframe, 
                                                          path=s3_path, 
                                                          dataset=dataset,
                                                          database=database,
                                                          mode=insert_mode,
                                                          table=table,
                                                          dtype=dtype,
                                                          partition_cols=partition_cols)
            return s3_write_data_return_value
        except Exception as e:
            print(f"Error writing to Athena table: {str(e)}")
            return None
