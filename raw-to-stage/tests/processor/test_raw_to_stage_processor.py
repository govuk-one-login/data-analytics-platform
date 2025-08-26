import pytest
import pandas as pd
from unittest.mock import MagicMock
from raw_to_stage_etl.processor.processor import RawToStageProcessor
from raw_to_stage_etl.strategies.scheduled_strategy import ScheduledStrategy
from raw_to_stage_etl.strategies.custom_strategy import CustomStrategy
from raw_to_stage_etl.strategies.view_strategy import ViewStrategy
from raw_to_stage_etl.util.data_preprocessing import DataPreprocessing
from test_code.util.helpers import get_pandas_transformation_for_individual_event

@pytest.mark.parametrize("strategy_cls", [ScheduledStrategy, CustomStrategy, ViewStrategy])
def test_correct_strategy_methods_called(strategy_cls):
    mock_strategy = MagicMock(spec=strategy_cls)
    preprocessor = DataPreprocessing({})
    test_dfs = get_pandas_transformation_for_individual_event(
        'auth_create_account', preprocessor.processed_dt, preprocessor.processed_time
    )
    mock_strategy.extract.return_value = [test_dfs['raw_df']]
    mock_strategy.transform.return_value = (
        test_dfs['stage_layer_df'],
        test_dfs['stage_layer_key_values_df'],
        0, 0, 0
    )

    processor = RawToStageProcessor({}, strategy=mock_strategy)
    processor.process()

    mock_strategy.extract.assert_called_once()
    args, _ = mock_strategy.transform.call_args
    pd.testing.assert_frame_equal(args[0], test_dfs['raw_df'])
    args, _ = mock_strategy.load.call_args
    pd.testing.assert_frame_equal(args[0], test_dfs['stage_layer_df'])
