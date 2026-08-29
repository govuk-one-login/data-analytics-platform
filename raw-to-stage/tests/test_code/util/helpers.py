import json
import os
import importlib
from datetime import datetime

from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, LongType, TimestampType
)


def get_spark():
    """Get or create a local SparkSession for testing."""
    return SparkSession.builder.master("local[1]").appName("test").getOrCreate()


def get_test_json_config(strategy='scheduled'):
    """
    Load a test JSON config file for a given strategy.

    Parameters:
        strategy (str): The strategy type (e.g., 'scheduled', 'custom', etc.)

    Returns:
        dict: The loaded JSON configuration.
    """
    config_dir = os.path.join(os.path.dirname(__file__), '..', 'config')
    config_file_path = os.path.join(config_dir, f'test_{strategy}_etl_config.json')
    with open(config_file_path, 'r') as f:
        return json.load(f)


def _infer_spark_type(value):
    """Map a Python value to a PySpark type."""
    if isinstance(value, int) and abs(value) > 2**31:
        return LongType()
    elif isinstance(value, int):
        return IntegerType()
    elif isinstance(value, datetime):
        return TimestampType()
    else:
        return StringType()


def _build_schema_from_dict(data_dict):
    """Build a PySpark StructType schema from a dict, handling None values as StringType."""
    fields = []
    for key, value in data_dict.items():
        if value is None:
            spark_type = StringType()
        else:
            spark_type = _infer_spark_type(value)
        fields.append(StructField(key, spark_type, nullable=True))
    return StructType(fields)


def _coerce_row_to_schema(row_dict, schema):
    """Coerce values in row_dict to match schema types (e.g. datetime -> string where needed)."""
    coerced = {}
    for field in schema.fields:
        val = row_dict.get(field.name)
        if val is None:
            coerced[field.name] = None
        elif isinstance(field.dataType, StringType) and isinstance(val, datetime):
            coerced[field.name] = str(val)
        elif isinstance(field.dataType, LongType) and isinstance(val, int):
            coerced[field.name] = val
        else:
            coerced[field.name] = val
    return coerced


def get_pyspark_transformation_for_individual_event(event_name, processed_dt, processed_time):
    """
    Import a transformation function for an event and return test PySpark DataFrames.

    Parameters:
        event_name (str): The event name (should match a module in test_code.transformation_data).
        processed_dt (int): The processed date.
        processed_time (int): The processed time.

    Returns:
        dict: PySpark DataFrames for 'raw_df', 'stage_layer_df', and 'stage_layer_key_values_df'.
    """
    module_path = f'test_code.transformation_data.{event_name}'
    timestamp_formatted = datetime.now()
    timestamp = int(timestamp_formatted.timestamp())
    timestamp_ms = int(timestamp_formatted.timestamp() * 1000)

    try:
        spark = get_spark()
        module = importlib.import_module(module_path)
        func = getattr(module, f'{event_name}_input_output')
        data = func(timestamp, timestamp_formatted, timestamp_ms, processed_dt, processed_time)

        # Build explicit schemas to handle None values
        raw_schema = _build_schema_from_dict(data['raw'])
        stage_schema = _build_schema_from_dict(data['stage_layer'])
        kv_schema = _build_schema_from_dict(data['stage_layer_key_values'][0])

        raw_row = _coerce_row_to_schema(data['raw'], raw_schema)
        stage_row = _coerce_row_to_schema(data['stage_layer'], stage_schema)
        kv_rows = [_coerce_row_to_schema(r, kv_schema) for r in data['stage_layer_key_values']]

        return {
            "raw_df": spark.createDataFrame([raw_row], schema=raw_schema),
            "stage_layer_df": spark.createDataFrame([stage_row], schema=stage_schema),
            "stage_layer_key_values_df": spark.createDataFrame(kv_rows, schema=kv_schema),
        }
    except Exception as e:
        print(f'Failed to load test data for event {event_name}: {e}')
        import traceback
        traceback.print_exc()
        return None
