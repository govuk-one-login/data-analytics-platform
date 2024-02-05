import sys
import logging
from awsglue.utils import getResolvedOptions

import awswrangler as wr
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def athena_query(database, query):
    """
    query athena and return dataframe
    """
    try:
        
        return wr.athena.read_sql_query(
                sql=query,
                database=database
            )
        
        
    except Exception as e:
        logger.error(f"An error has occured: {str(e)}")
    

def athena_insert(dataframe, database, table, s3_path):
    """
    insert dataframe into athena table
    """
    try:

        if not dataframe.empty:
            wr.s3.to_parquet(
                            df=dataframe,
                            path=s3_path,
                            dataset=True,
                            mode="append",
                            database=database,
                            table=table
                        )
        
        
    except Exception as e:
        logger.error(f"An error has occured: {str(e)}")
    


def generate_tbl_sql(source_db, reconcilation_db, reconcilation_tbl, table_name, metric_name, data_layer):
    """
    generate athena table partitions
    """

    if data_layer == 'stage_parent':
        return f'''select table_name,stg_processed_date,stg_event_name from 
                    (select distinct '{table_name}' as table_name,
                    stg.processed_dt as stg_processed_date,
                    stg.event_name as stg_event_name,
                    dq."table_name" as dq_tablename
                    from \"{source_db}\".\"{table_name}$partitions\" stg
                    left join "{reconcilation_db}"."{reconcilation_tbl}" dq 
                    on CAST(stg."processed_dt" AS varchar) = dq."processed_dt"
                    and lower(stg."event_name") = dq."event_name"
                    and dq."table_name" = '{table_name}'
                    and dq."metric_name" = '{metric_name}')
                    where dq_tablename is null;'''

    

def process_dq_metric(source_db, reconcilation_db, reconcilation_tbl, s3_path, df, metric_name, data_layer):
    """
    generate dq metric and insert into dq table
    """
    try:
        query_oject_counter = 0
        metric_sql = ''
        for tbl_partition in df.itertuples(index=False):
            if metric_sql != '':
                metric_sql = metric_sql + ' union '
                query_oject_counter += 1
    
            if metric_name == 'row_count' and data_layer == 'stage_parent':
                metric_sql = metric_sql + f'''select 'stage_parent' as data_layer,
                                                    '{tbl_partition.table_name}' as table_name,
                                                    '{(tbl_partition.stg_event_name).lower()}' as event_name,
                                                    '{tbl_partition.stg_processed_date}' as processed_dt,
                                                    year as year,
                                                    CAST(LPAD(CAST(month AS varchar), 2, '0') AS varchar) as month,
                                                    CAST(LPAD(CAST(day AS varchar), 2, '0') AS varchar) as day,
                                                    'row_count' as metric_name,
                                                    'record count by partition' as metric_desc,
                                                    cast(current_timestamp as varchar) as created_datetime,
                                                    count(*) as metric_value
                                                    from \"{source_db}\".\"{tbl_partition.table_name}\"
                                                    where CAST(processed_dt AS varchar) = '{tbl_partition.stg_processed_date}'
                                                    and event_name = '{tbl_partition.stg_event_name}'
                                                    group by 1,2,3,4,5,6,7,8,9,10'''
        

            # due to Athena query length limitation of 262,144 bytes, need to chunk execution query
            if metric_sql != '' and query_oject_counter > 50:

                df_metric_updates = athena_query(reconcilation_db, metric_sql)
                athena_insert(df_metric_updates, reconcilation_db, reconcilation_tbl, s3_path)

                # reset counter, query string
                query_oject_counter = 0
                metric_sql = ''
        
        # exit loop and execute the remaning query string
        if metric_sql != '':

            df_metric_updates = athena_query(reconcilation_db, metric_sql)
            athena_insert(df_metric_updates, reconcilation_db, reconcilation_tbl, s3_path)
            

    except Exception as e:
        logger.error(f"An error has occured: {str(e)}")





def main():

    try:

        args = getResolvedOptions(sys.argv,
                          ['JOB_NAME',
                           'stage_db',
                           'stage_parent_tbl',
                           'reconcilation_db',
                           'reconcilation_tbl',
                           's3_path',
                           'env'])
        

        # generate row_count dq metric for stg layer
        print(f'processing stage rowcounts for optimised solution')
        athena_stg_rowcount = generate_tbl_sql(args['stage_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['stage_parent_tbl'], 'row_count', 'stage_parent')
        df_stg_rowcounts = athena_query(args['reconcilation_db'], athena_stg_rowcount)
        
        if not df_stg_rowcounts.empty:
            print(f"rowcounts: {df_stg_rowcounts}")
            process_dq_metric(args['stage_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['s3_path'], df_stg_rowcounts, 'row_count', 'stage_parent')

                                
                        
    except Exception as e:
        logger.error(f"An error has occured: {str(e)}")


if __name__ == "__main__":
    main()
