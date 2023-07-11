import sys
from awsglue.utils import getResolvedOptions

import awswrangler as wr
import pandas as pd


# tables in error, so bypass until data issue fixed
ignore_tables = ['dcmaw_cri_vc_issued',
                 'ipv_address_cri_start',
                 'ipv_address_cri_vc_issued',
                 'ipv_kbv_cri_vc_issued',
                 'ipv_passport_cri_vc_issued',
                 'ipv_dl_cri_vc_issued',
                 'ipv_fraud_cri_vc_issued']


def athena_query(database, query):
    #query athena and return dataframe

    try:
        
        return wr.athena.read_sql_query(
                sql=query,
                database=database
            )
        
        
    except Exception as e:
        raise(e)
    

def athena_insert(dataframe, database, table, s3_path):
    #query athena and return dataframe

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
    

def generate_tbl_sql(raw_db,reconcilation_db,reconcilation_tbl,table_name, metric_name):

    return  f'''select table_name, raw_year, raw_month, raw_day, dq_tablename from
                (select distinct '{table_name}' as table_name,
                raw.year as raw_year,
                raw.month as raw_month,
                raw.day as raw_day,
                dq."table_name" as dq_tablename
                from \"{raw_db}\".\"{table_name}$partitions\" raw
                left join "{reconcilation_db}"."{reconcilation_tbl}" dq on raw."year" = dq."year"
                and raw."month" = dq."month"
                and raw."day" = dq."day"
                and dq."table_name" = '{table_name}'
                and dq."metric_name" = '{metric_name}')
                where dq_tablename is null;'''

    

def process_dq_metric(raw_db, reconcilation_db, reconcilation_tbl, s3_path, df, metric_name):

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
                           'reconcilation_db',
                           'reconcilation_tbl',
                           's3_path',
                           'process_config',
                           'env'])
        

        # get list of tables from raw, stage data-layers
        sql=f'''select table_schema, table_name 
        from information_schema.tables 
        WHERE table_catalog = 'awsdatacatalog'
        and table_schema in ('{args['env']}-txma-raw','{args['env']}-txma-stage')
        and table_type = 'BASE TABLE'
        and "table_name" != 'table_metadata' '''

        df_tables = athena_query(args['raw_db'], sql)

        #loop over the table results (pandas dataframe)
        #generate sql for raw table rowcounts
        for row in df_tables.itertuples(index=False):
            print(f'processing: {row.table_name}')
            if row.table_schema == f"{args['env']}-txma-raw" and row.table_name not in ignore_tables:
                print(f'in DQ generation loop: {row.table_name}')

                # generate row_count dq metric
                athena_rowcount = generate_tbl_sql(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], row.table_name, 'row_count')
                df_rowcounts = athena_query(args['reconcilation_db'], athena_rowcount)
                if not df_rowcounts.empty:
                    print(f"rowcounts: {df_rowcounts}")
                    process_dq_metric(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['s3_path'], df_rowcounts, 'row_count')

                # generate event_id duplicate dq metric
                athena_duplicate = generate_tbl_sql(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], row.table_name, 'event_id_duplicate')
                df_duplicates = athena_query(args['reconcilation_db'], athena_duplicate)
                if not df_duplicates.empty:
                    print(f"duplicates: {df_duplicates}")
                    process_dq_metric(args['raw_db'], args['reconcilation_db'], args['reconcilation_tbl'], args['s3_path'], df_duplicates, 'event_id_duplicate')

                                
                        
    except Exception as e:
        raise(e)


if __name__ == "__main__":
    main()