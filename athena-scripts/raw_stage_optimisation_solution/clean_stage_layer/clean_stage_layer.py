import boto3
import awswrangler as wr
import json

s3 = boto3.client('s3')

def run_query(sql, database):
    """Executes an SQL query on the specified database."""
    try:
        return wr.athena.read_sql_query(sql=sql, database=database)
    except Exception as e:
        print(f"Error running Athena query: {str(e)}")
        return None

def get_parquet_file(path):
    """Reads a Parquet file from the given S3 path."""
    try:
        return wr.s3.read_parquet(path=path)
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        return None

def upload_parquet_file(df, path):
    """Uploads a DataFrame as a Parquet file to the specified S3 path."""
    try:
        return wr.s3.to_parquet(
            df=df,
            path=path,
            dataset=True,
            mode='append'
        )
    except Exception as e:
        print(f"Error writing file: {str(e)}")
        return None

def get_stage_layer_sql(database, event_name):
    """Constructs the SQL query for fetching event data from stage layer."""
    return f"""
        SELECT event_id, "$path" as sl_path
        FROM "{database}"."txma_stage_layer"
    """
def get_stage_layer_key_values_sql(database, event_ids):
    """Constructs the SQL query for fetching event data from stage layer key values."""
    return f"""
        SELECT "$path" as kv_path
        FROM "{database}"."txma_stage_layer_key_values"
        WHERE event_id in ({format_event_ids(event_ids)})
        """

def format_event_ids(event_ids):
    """Formats a list of event IDs into a string for SQL IN clause."""
    return ", ".join(f"'{str(event_id)}'" for event_id in event_ids)

def process_file(file_path, event_ids, bucket, objects_to_delete):
    """Processes a single file, cleaning and uploading it."""
    key = file_path.replace(f's3://{bucket}/', '')
    df = get_parquet_file(path=file_path)
    if df is None:
        print(f'Failed to get Parquet file: {file_path}')
        return False

    df_cleaned = df[~df['event_id'].isin(event_ids)]
    if df_cleaned.empty:
        objects_to_delete.append({'Key': key})
        return True

    upload_result = upload_parquet_file(df=df_cleaned, path=f'{file_path.rsplit("/", 1)[0]}/')
    if upload_result is None:
        print(f'Failed to upload cleaned file for: {file_path}')
        return False

    objects_to_delete.append({'Key': key})
    print(f'Uploaded file: {upload_result["paths"][0]}')
    return True

def delete_objects(bucket, objects_to_delete):
    """Deletes objects from the S3 bucket."""
    if objects_to_delete:
        s3.delete_objects(Bucket=bucket, Delete={'Objects': objects_to_delete})
        print('Deleted outdated files.')

def process_clean_job(clean_job_type, database, bucket, event_name=None, event_ids=None):
    """Processes a data cleaning job based on event name or event IDs."""
    stage_layer_sql = get_stage_layer_sql(database, event_name)
    
    if clean_job_type == 'EVENT_NAME':
        stage_layer_sql += f" WHERE event_name = '{event_name}'"
    elif clean_job_type == 'EVENT_ID':
        stage_layer_sql += f" WHERE event_id in ({format_event_ids(event_ids)})"

    print(f"Running SQL query: {stage_layer_sql}")
    df_parquet_sl_paths = run_query(stage_layer_sql, database)
    
    sl_paths = df_parquet_sl_paths['sl_path'].dropna().unique().tolist()
    event_ids_from_query = df_parquet_sl_paths['event_id'].dropna().unique().tolist()

    if not sl_paths:
        print(f"There are no records found in the stage layer. Exiting.")
        return
    
    stage_layer_key_values_sql = get_stage_layer_key_values_sql(database, event_ids_from_query)
    
    print(f"Running SQL query: {stage_layer_key_values_sql}")
   
    df_parquet_sl_kv_paths = run_query(stage_layer_key_values_sql, database)
    kv_paths = []
    if not df_parquet_sl_kv_paths.empty: 
        # Extract unique paths from the query result
        kv_paths = df_parquet_sl_kv_paths['kv_path'].dropna().unique().tolist()

    objects_to_delete = []
    
    if clean_job_type == 'EVENT_NAME':
        # Prepare objects to delete (only for EVENT_NAME type)
        objects_to_delete.extend({'Key': path.replace(f's3://{bucket}/', '')} for path in sl_paths)
        # print(objects_to_delete)

    if kv_paths:
        for kv_path in kv_paths:
            process_file(kv_path, event_ids_from_query, bucket, objects_to_delete)
    
    if clean_job_type == 'EVENT_ID':
        if sl_paths:
            for sl_path in sl_paths:
                print(f'sl paths {sl_paths}')
                process_file(sl_path, event_ids_from_query, bucket, objects_to_delete)

    print(f'deleting objects {objects_to_delete}')
    delete_objects(bucket, objects_to_delete)

def main():
    """Loads configuration and initiates the data cleaning job."""
    with open("clean_stage_layer_config.json", encoding="utf-8") as config_file:
        clean_job_config = json.load(config_file)

    environment = clean_job_config['environment']
    database = f"{environment}-txma-stage"
    bucket = f"{environment}-dap-stage-layer"

    if clean_job_config['clean_by_event_name']['enabled']:
        config = clean_job_config['clean_by_event_name']['config']
        event_name = config['event_name']
        process_clean_job(
            clean_job_type='EVENT_NAME',
            event_name=event_name,
            database=database,
            bucket=bucket
        )
    elif clean_job_config['clean_by_event_id']['enabled']:
        config = clean_job_config['clean_by_event_id']['config']
        event_ids = config['event_ids']
        process_clean_job(
            clean_job_type='EVENT_ID',
            event_ids=event_ids,
            database=database,
            bucket=bucket
        )

if __name__ == "__main__":
    main()
