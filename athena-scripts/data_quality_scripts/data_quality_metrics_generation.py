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
    

def generate_tbl_sql(source_db, reconcilation_db, reconcilation_tbl, table_name, metric_name, data_layer):
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
                    where dq_tablename is null and
                    CONCAT(CAST(raw_year AS varchar),
                    CAST(LPAD(CAST(raw_month AS varchar), 2, '0') AS varchar),
                    CAST(LPAD(CAST(raw_day AS varchar), 2, '0') AS varchar)) != date_format(now(), '%Y%m%d');'''
    elif data_layer == 'stage':
        return f'''select table_name,stg_processed_date,stg_event_name from 
                    (select distinct '{table_name}' as table_name,
                    stg.processed_date as stg_processed_date,
                    stg.event_name as stg_event_name,
                    dq."table_name" as dq_tablename
                    from \"{source_db}\".\"{table_name}$partitions\" stg
                    left join "{reconcilation_db}"."{reconcilation_tbl}" dq 
                    on stg."processed_date" = dq."processed_dt"
                    and lower(stg."event_name") = dq."event_name"
                    and dq."table_name" = '{table_name}'
                    and dq."metric_name" = '{metric_name}')
                    where dq_tablename is null;'''

    

def process_dq_metric(source_db, reconcilation_db, reconcilation_tbl, s3_path, df, metric_name, data_layer):
    """
    generate dq metric and insert into dq table
    """
    try:
    
        metric_sql = ''
        for tbl_partition in df.itertuples(index=False):
            if metric_sql != '':
                metric_sql = metric_sql + ' union '

            if metric_name == 'row_count' and data_layer == 'raw':
                metric_sql = metric_sql + f'''select 'raw' as data_layer,
                                                    '{tbl_partition.table_name}' as table_name,
                                                    '{tbl_partition.table_name}' as event_name,
                                                    year as year,
                                                    month as month,
                                                    day as day,
                                                    'row_count' as metric_name,
                                                    'record count by partition' as metric_desc,
                                                    cast(current_timestamp as varchar) as created_datetime,
                                                    count(*) as metric_value
                                                    from \"{source_db}\".\"{tbl_partition.table_name}\"
                                                    where year = '{tbl_partition.raw_year}'
                                                    and month = '{tbl_partition.raw_month}'
                                                    and day = '{tbl_partition.raw_day}'
                                                    group by 1,2,3,4,5,6,7,8,9'''
            
            if metric_name == 'event_id_duplicate' and data_layer == 'raw':
                metric_sql = metric_sql + f'''select 'raw' as data_layer,
                                                    '{tbl_partition.table_name}' as table_name,
                                                    '{tbl_partition.table_name}' as event_name,
                                                    '{tbl_partition.raw_year}' as year,
                                                    '{tbl_partition.raw_month}' as month,
                                                    '{tbl_partition.raw_day}' as day,
                                                    'event_id_duplicate' as metric_name,
                                                    'event_id duplicate records by partition' as metric_desc,
                                                    cast(current_timestamp as varchar) as created_datetime,
                                                    count(*) as metric_value
                                                    from (select "event_id" as "event_id"
                                                    from \"{source_db}\".\"{tbl_partition.table_name}\"
                                                    where year = '{tbl_partition.raw_year}'
                                                    and month = '{tbl_partition.raw_month}'
                                                    and day = '{tbl_partition.raw_day}'
                                                    group by event_id
                                                    having count(*) > 1) as duplicates'''
                
            if metric_name == 'row_count' and data_layer == 'stage':
                metric_sql = metric_sql + f'''select 'stage' as data_layer,
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
                                                    where processed_date = '{tbl_partition.stg_processed_date}'
                                                    and event_name = '{tbl_partition.stg_event_name}'
                                                    group by 1,2,3,4,5,6,7,8,9,10'''
        
        
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
                print(f'processing raw events for product family: {family.product_family}')
                event_df = read_config_file(f"{args['process_config']}process_config/{family.product_family}_config.json")
                for row in event_df.itertuples(index=False):
                    if row.enabled == True:
                        
                        # check if table exists
                        if wr.catalog.does_table_exist(database=args['raw_db'], table=row.event_name):

                            print(f'processing raw event: {row.event_name}')

                            # generate row_count dq metric for raw layer
                            athena_rowcount = generate_tbl_sql(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], row.event_name, 'row_count', 'raw')
                            df_rowcounts = athena_query(args['reconcilation_db'], athena_rowcount)
                            if not df_rowcounts.empty:
                                print(f"rowcounts: {df_rowcounts}")
                                process_dq_metric(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['s3_path'], df_rowcounts, 'row_count', 'raw')

                            # generate event_id duplicate dq metric for raw layer
                            athena_duplicate = generate_tbl_sql(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], row.event_name, 'event_id_duplicate', 'raw')
                            df_duplicates = athena_query(args['reconcilation_db'], athena_duplicate)
                            if not df_duplicates.empty:
                                print(f"duplicates: {df_duplicates}")
                                process_dq_metric(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['s3_path'], df_duplicates, 'event_id_duplicate', 'raw')

                        else:

                            print(f'athena table for event: {row.event_name} does not exist')

                # generate row_count dq metric for stg layer
                print(f'processing stage rowcounts for product family: {family.product_family}')
                athena_stg_rowcount = generate_tbl_sql(args['stage_db'], args['reconcilation_db'], args['reconcilation_tbl'], family.product_family, 'row_count', 'stage')
                df_stg_rowcounts = athena_query(args['reconcilation_db'], athena_stg_rowcount)
                if not df_stg_rowcounts.empty:
                    print(f"rowcounts: {df_stg_rowcounts}")
                    process_dq_metric(args['stage_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['s3_path'], df_stg_rowcounts, 'row_count', 'stage')

                                
                        
    except Exception as e:
        raise(e)


if __name__ == "__main__":
    main()