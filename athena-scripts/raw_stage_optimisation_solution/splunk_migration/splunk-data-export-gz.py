#!py
import csv
import datetime
import splunklib.results as results
import boto3
from splunklib.client import connect
import uuid
import gzip


config_file = 'input config file path'
reconciliation_file = 'output file path'

access_key = ''

# update to retrieve from secrets manager
username= 'xxx'
password= 'xxx'

host_name = 'gds.splunkcloud.com'
host_port = '8089'
aws_region_name = 'eu-west-2'
s3_client = boto3.client('s3', region_name=aws_region_name)

service = connect(token=access_key, host=host_name, port=host_port, autologin=True)


def write_jsonl_to_s3(jsonl_data, s3_bucket, file_name):
    compressed_data = gzip.compress(jsonl_data.encode('utf-8'))
    s3_client.put_object(Body=compressed_data, Bucket=s3_bucket, Key=file_name)


def process_event(event_name, index_name, s3_bucket, s3_prefix, earliest_time, latest_time, search_mode, output_mode):
    kwargs_export = {
        "earliest_time": earliest_time,
        "latest_time": latest_time,
        "search_mode": search_mode,
        "output_mode": output_mode
    }
    searchquery_export = f'search index="{index_name}" event_name="{event_name}" | fields _raw'

    start_time = datetime.datetime.now()
    exportsearch_results = service.jobs.export(searchquery_export, **kwargs_export)

    reader = results.JSONResultsReader(exportsearch_results)
    jsonl_buffer = ''
    count = 0

    for result in reader:
        if isinstance(result, dict):
            event_data = result['_raw']
            jsonl_buffer += event_data + '\n'
            count += 1

            if count % 50000 == 0:
                file_name = f"{s3_prefix}/{event_name}/{str(uuid.uuid4())}.gz"
                write_jsonl_to_s3(jsonl_buffer, s3_bucket, file_name)
                print(f"{count} 50000 batch file ingested on S3 ::: {file_name}")
                jsonl_buffer = ''

        elif isinstance(result, results.Message):
            # Diagnostic messages may be returned in the results
            print("Message: %s" % result)

    # Write any remaining data in the buffer to S3
    if jsonl_buffer:
        file_name = f"{s3_prefix}/{event_name}/{str(uuid.uuid4())}.gz"
        print(f"Last batch file ingested on S3 ::: {file_name}")
        write_jsonl_to_s3(jsonl_buffer, s3_bucket, file_name)

    total_time_taken = datetime.datetime.now() - start_time
    print("Total events processed:", count)
    print('Total time taken:', total_time_taken)

    return count, total_time_taken


def generate_reconciliation_csv(config_file, reconciliation_file):
    with open(config_file, 'r') as file:
        reader = csv.DictReader(file)
        header = ['event_name', 'last_export_date_time', 'migrated_data_start_time', 'migrated_data_end_time', 'total_time_taken', 'total_events_migrated']
        rows = []

        for row in reader:
            event_name = row['event_name']
            index_name = row['splunk_index']
            s3_bucket = row['destination_s3_bucket']
            s3_prefix = row['destination_s3_prefix']
            earliest_time = row['earliest_time']
            latest_time = row['latest_time']
            search_mode = row['search_mode']
            output_mode = row['output_mode']

            count, total_time_taken = process_event(
                event_name, index_name, s3_bucket, s3_prefix, earliest_time, latest_time, search_mode, output_mode
            )

            rows.append({
                'event_name': event_name,
                'last_export_date_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'migrated_data_start_time': earliest_time,
                'migrated_data_end_time': latest_time,
                'total_time_taken': str(total_time_taken),
                'total_events_migrated': count
            })

    with open(reconciliation_file, 'w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=header)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)



generate_reconciliation_csv(config_file, reconciliation_file)
