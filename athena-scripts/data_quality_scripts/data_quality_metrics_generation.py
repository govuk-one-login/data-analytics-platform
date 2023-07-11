import sys
from awsglue.utils import getResolvedOptions

import awswrangler as wr
import pandas as pd



def read_config_file(path):
    """
    Returns TxMA config file
    """
    try:
        return wr.s3.read_json(path)
    
    except Exception as e:
        raise(e)



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
        raise(e)
    

def athena_insert(dataframe, database, table, s3_path):
    """
    insert dataframe into athena table
    """
    try:
        
        wr.s3.to_parquet(
                        df=dataframe,
                        path=s3_path,
                        dataset=True,
                        mode="append",
                        database=database,
                        table=table
                    )
        
        
    except Exception as e:
        raise(e)
    

def generate_tbl_sql(source_db,reconcilation_db,reconcilation_tbl,table_name, metric_name, data_layer):
    """
    generate athena table partitions
    """

    if data_layer == 'raw':
        return  f'''select table_name, raw_year, raw_month, raw_day, dq_tablename from
                    (select distinct '{table_name}' as table_name,
                    raw.year as raw_year,
                    raw.month as raw_month,
                    raw.day as raw_day,
                    dq."table_name" as dq_tablename
                    from \"{source_db}\".\"{table_name}$partitions\" raw
                    left join "{reconcilation_db}"."{reconcilation_tbl}" dq on raw."year" = dq."year"
                    and raw."month" = dq."month"
                    and raw."day" = dq."day"
                    and dq."table_name" = '{table_name}'
                    and dq."metric_name" = '{metric_name}')
                    where dq_tablename is null;'''
    elif data_layer == 'stage':
        return f'''select table_name,stg_processed_date,stg_event_name from 
                    (select distinct '{table_name}' as table_name,
                    stg.processed_date as stg_processed_date,
                    stg.event_name as stg_event_name,
                    dq."table_name" as dq_tablename
                    from \"{source_db}\".\"{table_name}$partitions\" stg
                    left join "{reconcilation_db}"."{reconcilation_tbl}" dq 
                    on stg."processed_date" = dq."processed_dt"
                    and stg."event_name" = dq."event_name"
                    and dq."table_name" = '{table_name}'
                    and dq."metric_name" = '{metric_name}')
                    where dq_tablename is null;'''

    

def process_dq_metric(raw_db, reconcilation_db, reconcilation_tbl, s3_path, df, metric_name):
    """
    generate dq metric and insert into dq table
    """
    try:
    
        metric_sql = ''
        for tbl_partition in df.itertuples(index=False):
            if metric_sql != '':
                metric_sql = metric_sql + ' union '

            if metric_name == 'row_count':
                metric_sql = metric_sql + f'''select 'raw' as data_layer,
                                                    '{tbl_partition.table_name}' as table_name,
                                                    '{tbl_partition.table_name}' as event_name,
                                                    year as year,
                                                    month as month,
                                                    day as day,
                                                    'row_count' as metric_name,
                                                    'record count by partition' as metric_desc,
                                                    cast(current_time as varchar) as created_datetime,
                                                    count(*) as metric_value
                                                    from \"{raw_db}\".\"{tbl_partition.table_name}\"
                                                    where year = '{tbl_partition.raw_year}'
                                                    and month = '{tbl_partition.raw_month}'
                                                    and day = '{tbl_partition.raw_day}'
                                                    group by 1,2,3,4,5,6,7,8,9'''
            
            if metric_name == 'event_id_duplicate':
                metric_sql = metric_sql + f'''select 'raw' as data_layer,
                                                    '{tbl_partition.table_name}' as table_name,
                                                    '{tbl_partition.table_name}' as event_name,
                                                    '{tbl_partition.raw_year}' as year,
                                                    '{tbl_partition.raw_month}' as month,
                                                    '{tbl_partition.raw_day}' as day,
                                                    'event_id_duplicate' as metric_name,
                                                    'event_id duplicate records by partition' as metric_desc,
                                                    cast(current_time as varchar) as created_datetime,
                                                    count(*) as metric_value
                                                    from (select "event_id" as "event_id"
                                                    from \"{raw_db}\".\"{tbl_partition.table_name}\"
                                                    where year = '{tbl_partition.raw_year}'
                                                    and month = '{tbl_partition.raw_month}'
                                                    and day = '{tbl_partition.raw_day}'
                                                    group by event_id
                                                    having count(*) > 1) as duplicates'''
        
        
        if metric_sql != '':

            df_metric_updates = athena_query(reconcilation_db, metric_sql)
            print(df_metric_updates)

            athena_insert(df_metric_updates, reconcilation_db, reconcilation_tbl, s3_path)
            

    except Exception as e:
        raise(e)



def main():

    try:

        args = getResolvedOptions(sys.argv,
                          ['JOB_NAME',
                           'raw_db',
                           'stage_db',
                           'reconcilation_db',
                           'reconcilation_tbl',
                           's3_path',
                           'process_config',
                           'env'])
        

        #read process config
        df_product_family = read_config_file(f"{args['process_config']}process_config/product_family_config.json")

        for family in df_product_family.itertuples(index=False):
            if family.enabled == True:
                print(f'processing product family: {family.product_family}')
                event_df = read_config_file(f"{args['process_config']}process_config/{family.product_family}_config.json")
                for row in event_df.itertuples(index=False):
                    if row.enabled == True:
                        
                        # check if table exists
                        if wr.catalog.does_table_exist(database=args['raw_db'], table=row.event_name):

                            print(f'processing event: {row.event_name}')

                            # generate row_count dq metric for raw layer
                            athena_rowcount = generate_tbl_sql(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], row.event_name, 'row_count', 'raw')
                            df_rowcounts = athena_query(args['reconcilation_db'], athena_rowcount)
                            if not df_rowcounts.empty:
                                print(f"rowcounts: {df_rowcounts}")
                                process_dq_metric(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['s3_path'], df_rowcounts, 'row_count')

                            # generate event_id duplicate dq metric for raw layer
                            athena_duplicate = generate_tbl_sql(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], row.event_name, 'event_id_duplicate', 'raw')
                            df_duplicates = athena_query(args['reconcilation_db'], athena_duplicate)
                            if not df_duplicates.empty:
                                print(f"duplicates: {df_duplicates}")
                                process_dq_metric(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['s3_path'], df_duplicates, 'event_id_duplicate')

                        else:

                            print(f'athena table for event: {row.event_name} does not exist')

                # generate row_count dq metric for stg layer
                athena_rowcount = generate_tbl_sql(args['stage_db'], args['reconcilation_db'], args['reconcilation_tbl'], row.event_name, 'row_count', 'stage')

                                
                        
    except Exception as e:
        raise(e)


if __name__ == "__main__":
    main()