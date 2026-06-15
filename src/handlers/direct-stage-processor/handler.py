"""Direct SQS to Stage Layer with Intelligent Batching (No Raw Layer)"""

import json
import boto3
import os
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO

class DirectStageProcessor:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.stage_bucket = os.environ['STAGE_BUCKET']
        self.batch_size = int(os.environ.get('BATCH_SIZE', '50000'))
        self.memory_buffer = []
        self.current_partition = None
        
    def process_sqs_batch(self, records: List[Dict]) -> None:
        """Process SQS records and batch them intelligently."""
        
        for record in records:
            try:
                # Parse and validate event
                event_data = json.loads(record['body'])
                transformed_event = self.transform_event(event_data)
                
                # Determine partition
                partition = self.get_partition(transformed_event)
                
                # If partition changed and we have data, flush current batch
                if self.current_partition and partition != self.current_partition:
                    if len(self.memory_buffer) > 0:
                        self.flush_to_stage()
                
                self.current_partition = partition
                self.memory_buffer.append(transformed_event)
                
                # Flush when we reach batch size
                if len(self.memory_buffer) >= self.batch_size:
                    self.flush_to_stage()
                    
            except Exception as e:
                print(f"Error processing record: {e}")
                
        # Flush remaining records (if any)
        if len(self.memory_buffer) > 0:
            self.flush_to_stage()
    
    def transform_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
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
            'restricted': json.dumps(event.get('restricted', {})),
            'processed_date': datetime.now().date().isoformat()
        }
    
    def get_partition(self, event: Dict[str, Any]) -> str:
        """Generate partition path from event timestamp."""
        dt = datetime.fromtimestamp(event['timestamp'])
        return f"year={dt.year}/month={dt.month:02d}/day={dt.day:02d}"
    
    def flush_to_stage(self) -> None:
        """Write accumulated records to stage layer as Parquet."""
        if not self.memory_buffer:
            return
            
        # Convert to DataFrame and Parquet
        df = pd.DataFrame(self.memory_buffer)
        table = pa.Table.from_pandas(df)
        parquet_buffer = BytesIO()
        pq.write_table(table, parquet_buffer, compression='snappy')
        
        # Generate S3 key
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        s3_key = f"txma-events/{self.current_partition}/batch_{timestamp}_{len(self.memory_buffer)}.parquet"
        
        # Upload to S3
        self.s3_client.put_object(
            Bucket=self.stage_bucket,
            Key=s3_key,
            Body=parquet_buffer.getvalue()
        )
        
        print(f"Flushed {len(self.memory_buffer)} records to {s3_key}")
        self.memory_buffer = []

def lambda_handler(event, context):
    """Enhanced Lambda handler with intelligent batching."""
    processor = DirectStageProcessor()
    processor.process_sqs_batch(event['Records'])
    return {'statusCode': 200}