import sys
import json
import logging

from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame
from pyspark.sql.functions import lit
from pyspark.sql.types import StringType, IntegerType, DoubleType, BooleanType, TimestampType
from pyspark.sql import functions as F


args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Setup logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():

    try:

        args = getResolvedOptions(
            sys.argv,
            [
                "JOB_NAME",
                "redshift_metadata",
                "reference_data_file_metadata",
                "RedshiftTempDir",
                "GlueConnection"
            ]
        )

        # Get the glue job execution ID
        args_id = getResolvedOptions(sys.argv, [])
        job_run_id = args_id['JOB_RUN_ID']
        reference_data_table_exists = False

        redshift_metadata = args["redshift_metadata"]
        reference_data_file_metadata = args['reference_data_file_metadata']
        tmp_dir = args["RedshiftTempDir"]
        glue_conn = args["GlueConnection"]

        logger.info(f"extracted redshift metadata:\n {redshift_metadata}")
        logger.info(f"extracted reference data file metadata:\n {reference_data_file_metadata}")

        # Define a mapping from Spark data types to SQL equivalents
        data_type_mapping = {
            StringType(): "VARCHAR",
            IntegerType(): "INTEGER",
            DoubleType(): "DECIMAL",
            BooleanType(): "BOOLEAN",
            TimestampType(): "TIMESTAMP"
            # Add more mappings as needed
        }

        # Convert string to dictionary
        redshift_metadata_dict = json.loads(redshift_metadata)
        reference_data_file_metadata_dict = json.loads(reference_data_file_metadata)

        # Query Redshift database to validate whether reference data table exists
        table_exists_dyf = glueContext.create_dynamic_frame.from_options(connection_type="redshift", 
                                                                         connection_options={"sampleQuery": f"SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = '{redshift_metadata_dict['schema']}' AND tablename = '{redshift_metadata_dict['table']}')",
                                                                         "redshiftTmpDir": f"{tmp_dir}", 
                                                                         "useConnectionProperties": "true", 
                                                                         "connectionName": f"{glue_conn}"}, 
                                                                         transformation_ctx="table_exists_dyf")

        table_exists_dyf.printSchema()
        table_exists_dyf.toDF().show()

        # Convert dynamic frame to DataFrame
        table_exists_df = table_exists_dyf.toDF()

        # Get the schema to retrieve column names
        table_exists_columns = table_exists_df.schema.names

        # Iterate over rows in DataFrame
        for row in table_exists_df.collect():
            # Iterate over columns dynamically
            for column_name in table_exists_columns:
                column_value = row[column_name]
                print(f"Column: {column_name}, Value: {column_value}")

                if column_value:
                    reference_data_table_exists = True

        
        # Read S3 reference data file into dynamic frame
        source_file_path = f"s3://{reference_data_file_metadata_dict['bucket']}/{reference_data_file_metadata_dict['file_path']}"

        source_file_dyf = glueContext.create_dynamic_frame.from_options(format_options={"quoteChar": -1, "withHeader": True, "separator": ","}, 
                                                                        connection_type="s3", 
                                                                        format="csv", 
                                                                        connection_options={
                                                                                   "paths": [f"{source_file_path}"]}, 
                                                                        transformation_ctx="source_file_dyf")


        source_file_dyf.printSchema()
        source_file_df = source_file_dyf.toDF()

        # Add metadata columns
        # Add formatted timestamp column
        source_file_df = source_file_df.withColumn("ingestion_timestamp", F.date_format(F.current_timestamp(), "yyyy-MM-dd HH:mm:ss"))
        source_file_df = source_file_df.withColumn("reference_data_file", lit(source_file_path))
        source_file_df = source_file_df.withColumn("job_execution_id", lit(job_run_id))

        source_file_df.show(2)

        # Convert Spark DataFrame to DynamicFrame
        file_ingestion_dyf = DynamicFrame.fromDF(source_file_df, glueContext, "file_ingestion_dyf")

        # Get schema fields
        source_fields = file_ingestion_dyf.schema().fields
        logger.info(f"source_fields:\n {source_fields}")

        if redshift_metadata_dict['operation'] == 'overwrite' and reference_data_table_exists:
            
            source_to_redshift_dyf = glueContext.write_dynamic_frame.from_options(frame=file_ingestion_dyf, 
                                                                                connection_type="redshift", 
                                                                                connection_options={"redshiftTmpDir": f"{tmp_dir}",
                                                                                                    "useConnectionProperties": "true",
                                                                                                    "dbtable": f"{redshift_metadata_dict['schema']}.{redshift_metadata_dict['table']}", 
                                                                                                    "connectionName": f"{glue_conn}",
                                                                                                    "preactions": f"TRUNCATE TABLE {redshift_metadata_dict['schema']}.{redshift_metadata_dict['table']};"}, 
                                                                                    transformation_ctx="source_to_redshift_dyf")

            
        elif redshift_metadata_dict['operation'] == 'append' or (not reference_data_table_exists):
            
            
            # Insert reference data
            source_to_redshift_dyf = glueContext.write_dynamic_frame.from_options(frame=file_ingestion_dyf, 
                                                                            connection_type="redshift", 
                                                                            connection_options={"redshiftTmpDir": f"{tmp_dir}", 
                                                                                                "useConnectionProperties": "true", 
                                                                                                "dbtable": f"{redshift_metadata_dict['schema']}.{redshift_metadata_dict['table']}", 
                                                                                                "connectionName": f"{glue_conn}"}, 
                                                                            transformation_ctx="source_to_redshift_dyf")
            
        else:
            # Invalid processing options, raise error
            sys.exit(f"Invalid processing logic options: operation: {redshift_metadata_dict['operation']} table exists: {reference_data_table_exists}")

        logger.info(f"operation: {redshift_metadata_dict['operation']}, existing reference table exists: {reference_data_table_exists} processing completed successfully.")

        job.commit()

    except Exception as e:

        #print(f"Exception Error: {str(e)}")
        logger.error(f"Exception raised: {str(e)}")
        sys.exit("Exception encountered within main, exiting process")
        raise


if __name__ == "__main__":
    main()