"""DynamoDB-Based Intelligent Batching System for 50k Record Files"""

import json
import boto3
import os
from typing import List, Dict
from datetime import datetime, timedelta

class DynamoDBBatchManager:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.s3_client = boto3.client('s3')
        self.batch_table = self.dynamodb.Table(os.environ['BATCH_TABLE'])
        self.stage_bucket = os.environ['STAGE_BUCKET']
        self.target_batch_size = 50000
        
    def add_events_to_batch(self, events: List[Dict]) -> None:
        """Add events to DynamoDB batches, creating 50k record files."""
        
        for event in events:
            partition_key = self.get_partition_key(event)
            batch_id = self.find_or_create_batch(partition_key)
            self.add_event_to_batch(batch_id, event)
            
            if self.is_batch_ready(batch_id):
                self.flush_batch_to_stage(batch_id)
    
    def find_or_create_batch(self, partition_key: str) -> str:
        """Find existing batch or create new one for partition."""
        
        response = self.batch_table.query(
            IndexName='partition-status-index',
            KeyConditionExpression='partition_key = :pk AND batch_status = :status',
            ExpressionAttributeValues={
                ':pk': partition_key,
                ':status': 'ACTIVE'
            },
            Limit=1
        )
        
        if response['Items']:
            return response['Items'][0]['batch_id']
        
        # Create new batch
        batch_id = f"{partition_key}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.batch_table.put_item(
            Item={
                'batch_id': batch_id,
                'partition_key': partition_key,
                'batch_status': 'ACTIVE',
                'record_count': 0,
                'created_at': datetime.now().isoformat(),
                'events': []
            }
        )
        
        return batch_id
    
    def add_event_to_batch(self, batch_id: str, event: Dict) -> None:
        """Add single event to batch in DynamoDB."""
        
        self.batch_table.update_item(
            Key={'batch_id': batch_id},
            UpdateExpression='SET record_count = record_count + :inc, events = list_append(events, :event)',
            ExpressionAttributeValues={
                ':inc': 1,
                ':event': [event]
            }
        )
    
    def is_batch_ready(self, batch_id: str) -> bool:
        """Check if batch has reached target size or timeout."""
        
        response = self.batch_table.get_item(Key={'batch_id': batch_id})
        batch = response['Item']
        
        if batch['record_count'] >= self.target_batch_size:
            return True
        
        created_at = datetime.fromisoformat(batch['created_at'])
        if datetime.now() - created_at > timedelta(minutes=15):
            return True
            
        return False
    
    def flush_batch_to_stage(self, batch_id: str) -> None:
        """Flush completed batch to S3 stage layer as Parquet."""
        
        response = self.batch_table.get_item(Key={'batch_id': batch_id})
        batch = response['Item']
        
        if batch['batch_status'] != 'ACTIVE':
            return
        
        events = batch['events']
        partition_key = batch['partition_key']
        
        import pandas as pd
        
        df = pd.DataFrame(events)
        s3_key = f"txma-events/{partition_key}/batch_{batch_id}_{len(events)}.parquet"
        
        parquet_buffer = df.to_parquet(compression='snappy')
        self.s3_client.put_object(
            Bucket=self.stage_bucket,
            Key=s3_key,
            Body=parquet_buffer
        )
        
        self.batch_table.update_item(
            Key={'batch_id': batch_id},
            UpdateExpression='SET batch_status = :status, completed_at = :completed',
            ExpressionAttributeValues={
                ':status': 'COMPLETED',
                ':completed': datetime.now().isoformat()
            }
        )
        
        print(f"Flushed batch {batch_id} with {len(events)} records")
    
    def get_partition_key(self, event: Dict) -> str:
        """Generate partition key from event."""
        timestamp = int(event.get('timestamp', 0))
        dt = datetime.fromtimestamp(timestamp)
        return f"year={dt.year}/month={dt.month:02d}/day={dt.day:02d}"

def sqs_processor_handler(event, context):
    """Process SQS events and add to batches."""
    batch_manager = DynamoDBBatchManager()
    
    events = []
    for record in event['Records']:
        event_data = json.loads(record['body'])
        events.append(event_data)
    
    batch_manager.add_events_to_batch(events)
    return {'statusCode': 200}