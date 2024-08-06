
import boto3
import awswrangler as wr
import json

s3 = boto3.client('s3')


def run_query(sql, database):
    try:
        return wr.athena.read_sql_query(sql=sql,
                                        database=database)
    except Exception as e:
        print(f"Error running athena query {str(e)}")
        return None


def get_parquet_file(path):
    try:
        return wr.s3.read_parquet(path=path)
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        return None


def upload_parquet_file(df, path):
    try:
        return wr.s3.to_parquet(
            df=df,
            path=path,
            dataset=True,
            mode='append')
    except Exception as e:
        print(f"Error writing file: {str(e)}")
        return None


def generate_select_query(event_name, database):

    sql = f'''select sl.event_id, sl."$path" as sl_path, slkv."$path" as kv_path
              from \"{database}\".\"txma_stage_layer\" sl
              inner join \"{database}\".\"txma_stage_layer_key_values\" slkv on sl.event_id = slkv.event_id
              where sl.event_name = \'{event_name}\'
              '''
    return sql


def process_clean_job(event_name, database, bucket):

    sql = generate_select_query(
        event_name, database)

    df_parquet_paths = run_query(sql, database)

    event_ids = df_parquet_paths['event_id'].drop_duplicates().tolist()
    kv_paths = df_parquet_paths['kv_path'].drop_duplicates().tolist()
    sl_paths = df_parquet_paths['sl_path'].drop_duplicates().tolist()

    if not kv_paths or not event_ids or not sl_paths:
        print(f'There are no records for {event_name} in the stage layer, exiting program')
        return

    # initialise list with the stage layer objects that need to be deleted
    objects_to_delete = list(
        map(lambda x: {'Key': str(x).replace(f's3://{bucket}/', '')}, sl_paths))

    # initialise properties for summary report
    total_files_failed_to_process = 0
    files_processed_count = 0
    total_rows_removed = 0
    total_files_to_process = len(kv_paths) + len(sl_paths)
    summary = {'success': [], 'errors': [], 'stats': {}}

    # for each parquet file in the key values table, filter out any event ids that match the event name and upload a new filtered parquet file to the same partition
    for kv_path in kv_paths:

        kv_path = str(kv_path)
        key = kv_path.replace(f's3://{bucket}/', '')

        df = get_parquet_file(path=kv_path)

        if df is None:
            summary['errors'].append({'event_name': event_name, 'path': kv_path, 'stats': None,
                                     'success': False, 'reason': 'Failed to read parquet file for key value table'})
            total_files_failed_to_process += 1
            continue

        df_cleaned = df[~df['event_id'].isin(event_ids)]

        if df_cleaned.empty:
            objects_to_delete.append({
                'Key': key
            })
            continue

        upload_return_value = upload_parquet_file(
            df=df_cleaned, path=f'{kv_path.rsplit('/', 1)[0]}/')

        if upload_return_value is None:
            summary['errors'].append({'event_name': event_name, 'path': kv_path, 'stats': None,
                                     'success': False, 'reason': 'Failed to upload cleaned file for key value table'})
            total_files_failed_to_process += 1
            continue

        objects_to_delete.append({
            'Key': key
        })

        print('uploaded file')

        total_rows_removed += int(len(df)) - int(len(df_cleaned))

    # delete all old files that contain references to the event name
    if (objects_to_delete):
        delete_objects_response = s3.delete_objects(
            Bucket=bucket, Delete={'Objects': objects_to_delete})
        print('deleting outdated files')

        successful_deletions = delete_objects_response.get('Deleted', None)
        errors = delete_objects_response.get('Errors', None)

        if (successful_deletions):
            for success in successful_deletions:
                files_processed_count += 1
                summary['success'].append({
                    'event_name': event_name,
                    'path': success.get('Key', None),
                    'success': True
                })

        if (errors):
            for error in errors:
                total_files_failed_to_process += 1
                summary['errors'].append({
                    'event_name': event_name,
                    'path': error.get('Key', None),
                    'success': False,
                    'reason': 'Failed to delete object'
                })

    summary['stats'] = {
        'total_files_to_process': total_files_to_process,
        'files_processed_count': files_processed_count,
        'total_rows_removed_kv_table': total_rows_removed,
        'total_files_failed_to_process': total_files_failed_to_process
    }

    print(summary)


def main():
    clean_job_config = {}

    with open("clean_stage_layer_config.json", encoding="utf-8") as config_file:
        clean_job_config = json.load(config_file)
        config_file.close()

    if clean_job_config['clean_by_event_name']['enabled']:
        config = clean_job_config['clean_by_event_name']['config']
        print(config)

        event_name = config['event_name']
        environment = config['environment']
        database = f"{environment}-txma-stage"
        bucket = f"{environment}-dap-stage-layer"

        process_clean_job(
            event_name=event_name,
            database=database,
            bucket=bucket
        )
    else:
        print("Clean Job not enabled, exiting program")
        return


if __name__ == "__main__":
    main()
