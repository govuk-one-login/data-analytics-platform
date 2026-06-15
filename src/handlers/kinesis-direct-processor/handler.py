"""Kinesis Data Streams with Lambda Batching (No Raw Layer)"""

import json
import boto3
import base64
from typing import List, Dict
from datetime import datetime
import pandas as pd
from io import BytesIO

class KinesisDirectProcessor:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.stage_bucket = os.environ['STAGE_BUCKET']
        self.batch_size = 50000
        
    def process_kinesis_records(self, records: List[Dict]) -> None:
        """Process Kinesis records in batches of 50k."""
        
        partitioned_records = {}
        
        for record in records:
            payload = base64.b64decode(record['kinesis']['data'])
            event_data = json.loads(payload)
            
            transformed_event = self.transform_event(event_data)
            partition = self.get_partition(transformed_event)
            
            if partition not in partitioned_records:
                partitioned_records[partition] = []
            
            partitioned_records[partition].append(transformed_event)
        
        for partition, events in partitioned_records.items():
            self.write_partition_batches(partition, events)
    
    def write_partition_batches(self, partition: str, events: List[Dict]) -> None:
        """Write events in 50k batches to stage layer."""
        
        for i in range(0, len(events), self.batch_size):
            batch = events[i:i + self.batch_size]
            
            df = pd.DataFrame(batch)
            parquet_buffer = BytesIO()
            df.to_parquet(parquet_buffer, compression='snappy', index=False)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
            s3_key = f"txma-events/{partition}/batch_{timestamp}_{len(batch)}.parquet"
            
            self.s3_client.put_object(
                Bucket=self.stage_bucket,
                Key=s3_key,
                Body=parquet_buffer.getvalue()
            )
            
            print(f"Written {len(batch)} records to {s3_key}")
    
    def transform_event(self, event: Dict) -> Dict:
        """Transform raw event to stage schema."""
        return {
            'event_id': event.get('event_id'),
            'event_name': event.get('event_name'),
            'component_id': event.get('component_id'),
            'client_id': event.get('client_id'),
            'timestamp': int(event.get('timestamp', 0)),
            'user_id': event.get('user', {}).get('user_id'),
            'event_timestamp_ms': int(event.get('event_timestamp_ms', 0)),
            'extensions': json.dumps(event.get('extensions', {})),
            'processed_date': datetime.now().date().isoformat()
        }
    
    def get_partition(self, event: Dict) -> str:
        """Generate partition from timestamp."""
        dt = datetime.fromtimestamp(event['timestamp'])
        return f"year={dt.year}/month={dt.month:02d}/day={dt.day:02d}"

def kinesis_lambda_handler(event, context):
    """Lambda handler for Kinesis Data Streams."""
    processor = KinesisDirectProcessor()
    processor.process_kinesis_records(event['Records'])
    return {'statusCode': 200}