import json
import unittest

import pytest
from raw_to_stage_etl.strategies.scheduled_strategy import date_minus_days, ScheduledStrategy
from raw_to_stage_etl.util.data_preprocessing import DataPreprocessing
from test_code.transformation_data.auth_create_account import auth_create_account_input_output
from datetime import datetime
import pandas as pd
import os

class ScheduledStrategyTestCase(unittest.TestCase):

    @pytest.fixture(autouse=True)
    def setup(self, mocker):
        config_file_path = os.path.join(os.getcwd(), 'tests/test_code/config/test_etl_config.json')
        with open(config_file_path) as f:
            self.json_config = json.load(f)
        self.mock_glue = mocker.Mock()
        self.mock_s3 = mocker.Mock()
        self.preprocessor = DataPreprocessing(self.mock_glue)
        self.scheduled_strategy = ScheduledStrategy({}, self.json_config, self.mock_glue, self.mock_s3, self.preprocessor)

    def test_transform_logic_outputs_stage_layer_and_key_values_dataframes(self):
        
        # given
        timestamp_formatted = datetime.now()
        timestamp = int(datetime.timestamp(timestamp_formatted))
        timestamp_ms = int(datetime.timestamp(timestamp_formatted) * 1000)

        input_output_test_data = auth_create_account_input_output(timestamp, timestamp_formatted, timestamp_ms, self.preprocessor.processed_dt, self.preprocessor.processed_time)
        df_raw = pd.DataFrame([input_output_test_data['raw']])
        expected_stage_layer_df_output = pd.DataFrame([input_output_test_data['stage_layer']])
        expected_stage_layer_key_values_df_output = pd.DataFrame(input_output_test_data['stage_layer_key_values'])
        
        # when
        ouput = self.scheduled_strategy.transform(df_raw=df_raw)
        
        actual_stage_layer_df_output = ouput[0]
        actual_stage_layer_key_values_df_output = ouput[1]
        
        # then
        pd.testing.assert_frame_equal(actual_stage_layer_df_output, expected_stage_layer_df_output)
        pd.testing.assert_frame_equal(actual_stage_layer_key_values_df_output, expected_stage_layer_key_values_df_output)

   
    def test_date_minus_days(self):
        date = "20250609"
        self.assertEqual(date_minus_days(date, 10), "20250530")


if __name__ == '__main__':
    unittest.main()
