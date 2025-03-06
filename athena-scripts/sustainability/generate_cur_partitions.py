import boto3
import json

glue = boto3.client('glue')
secretsmanager = boto3.client('secretsmanager')
DATABASE = 'production-sustainability'
TABLE_NAME = 'cur'
SECRET_NAME= 'cur-account-ids'
    
def get_accound_ids():
    try:
        secrets = json.loads(secretsmanager.get_secret_value(
            SecretId = SECRET_NAME
        )['SecretString'])
        
        return secrets
    except Exception as e:
        raise e

SRE_ACCOUNT_ID = get_accound_ids()['ct-shared-services']
BILL_PAYER_ACCOUNT_ID = get_accound_ids()['source-bill-payer']

S3_BUCKET = f's3://cid-{SRE_ACCOUNT_ID}-shared'
PREFIX = f'cur/{BILL_PAYER_ACCOUNT_ID}/cid/cid'

def generate_year_partitions(start_year, end_year) -> list:
    years_diff = end_year - start_year
    year_partitions = []
    for diff in range(years_diff + 1):
        year_partitions.append(start_year + diff)
    return year_partitions
    
def generate_month_partitions() -> list:
    index = 1
    month_partitions = []
    for _ in range(12):
        month_partitions.append(index)
        index += 1
    return month_partitions
        
def generate_create_partitions_request(start_year, end_year):
    year_partitions = generate_year_partitions(start_year, end_year)
    month_partitions = generate_month_partitions()
    
    partitions = []
    for year in year_partitions:
        for month in month_partitions:
            partition = {
                'Values': [str(year), str(month)],
                'StorageDescriptor': {
                    'Location': f'{S3_BUCKET}/{PREFIX}/year={year}/month={month}/',
                    'InputFormat': 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
                    'OutputFormat': 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
                    'SerdeInfo': {
                        'SerializationLibrary': 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
                        'Parameters': {
                            'serialization.format': '1',
                            'classification': 'parquet'
                        }
                    }
                    
                }
            } 
            partitions.append(partition)
            
            if len(partitions) == 100:
                glue.batch_create_partition(
                DatabaseName= DATABASE,
                TableName = TABLE_NAME,
                PartitionInputList = partitions
                )
                
                partitions = []
    
    if partitions:
        glue.batch_create_partition(
                DatabaseName= DATABASE,
                TableName = TABLE_NAME,
                PartitionInputList = partitions
                )
        
    return partitions

generate_create_partitions_request(2022, 2040)

