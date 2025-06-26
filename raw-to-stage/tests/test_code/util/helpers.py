import json
import os
import importlib
import pandas as pd
from datetime import datetime

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

def get_pandas_transformation_for_individual_event(event_name, processed_dt, processed_time):
    """
    Import a transformation function for an event and return test DataFrames.

    Parameters:
        event_name (str): The event name (should match a module in test_code.transformation_data).
        processed_dt (int): The processed date.
        processed_time (int): The processed time.

    Returns:
        dict: DataFrames for 'raw_df', 'stage_layer_df', and 'stage_layer_key_values_df'.
    """
    module_path = f'test_code.transformation_data.{event_name}'
    timestamp_formatted = datetime.now()
    timestamp = int(timestamp_formatted.timestamp())
    timestamp_ms = int(timestamp_formatted.timestamp() * 1000)

    try:
        module = importlib.import_module(module_path)
        func = getattr(module, f'{event_name}_input_output')
        data = func(timestamp, timestamp_formatted, timestamp_ms, processed_dt, processed_time)
        return {
            "raw_df": pd.DataFrame([data['raw']]),
            "stage_layer_df": pd.DataFrame([data['stage_layer']]),
            "stage_layer_key_values_df": pd.DataFrame(data['stage_layer_key_values'])
        }
    except Exception as e:
        print(f'Failed to load test data for event {event_name}: {e}')
        return None
