import pytest
import pandas as pd
from raw_to_stage_etl.strategies.scheduled_strategy import ScheduledStrategy
from raw_to_stage_etl.strategies.backfill_strategy import BackfillStrategy
from raw_to_stage_etl.strategies.custom_strategy import CustomStrategy
from raw_to_stage_etl.strategies.view_strategy import ViewStrategy
from raw_to_stage_etl.util.data_preprocessing import DataPreprocessing
from test_code.util.helpers import get_pandas_transformation_for_individual_event, get_test_json_config

@pytest.fixture
def setup_mocks(mocker):
    json_config = get_test_json_config('scheduled')
    mock_glue = mocker.Mock()
    mock_s3 = mocker.Mock()
    preprocessor = DataPreprocessing(mock_glue)
    args = {}
    return {
        "json_config": json_config,
        "mock_glue": mock_glue,
        "mock_s3": mock_s3,
        "preprocessor": preprocessor,
        "args": args
    }

@pytest.mark.parametrize("strategy_cls", [ScheduledStrategy, CustomStrategy, ViewStrategy])
def test_transform_logic_outputs_stage_layer_and_key_values_dataframes(setup_mocks, strategy_cls):
    mocks = setup_mocks
    test_dfs = get_pandas_transformation_for_individual_event(
        'auth_create_account',
        mocks["preprocessor"].processed_dt,
        mocks["preprocessor"].processed_time
    )
    strategy = strategy_cls(
        mocks["args"],
        mocks["json_config"],
        mocks["mock_glue"],
        mocks["mock_s3"],
        mocks["preprocessor"]
    )

    actual_output = strategy.transform(df_raw=test_dfs['raw_df'])

    pd.testing.assert_frame_equal(actual_output[0], test_dfs['stage_layer_df'])
    pd.testing.assert_frame_equal(actual_output[1], test_dfs['stage_layer_key_values_df'])
