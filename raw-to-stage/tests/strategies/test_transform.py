import pytest
import pandas as pd
from unittest.mock import Mock
from raw_to_stage_etl.strategies.scheduled_strategy import ScheduledStrategy
from raw_to_stage_etl.strategies.backfill_strategy import BackfillStrategy
from raw_to_stage_etl.strategies.custom_strategy import CustomStrategy
from raw_to_stage_etl.strategies.view_strategy import ViewStrategy
from raw_to_stage_etl.util.data_preprocessing import DataPreprocessing
from test_code.util.helpers import get_pandas_transformation_for_individual_event, get_test_json_config

@pytest.fixture
def setup_mocks():
    json_config = get_test_json_config('scheduled')
    mock_glue = Mock()
    mock_s3 = Mock()
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

@pytest.mark.parametrize("strategy_cls", [ScheduledStrategy, CustomStrategy, ViewStrategy])
def test_transform_with_multiple_events(setup_mocks, strategy_cls):

    mocks = setup_mocks
    test_dfs = get_pandas_transformation_for_individual_event(
        'auth_create_account',
        mocks["preprocessor"].processed_dt,
        mocks["preprocessor"].processed_time
    )
    test_dfs2 = get_pandas_transformation_for_individual_event(
        'dcmaw_cri_vc_issued',
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
    df_raw = pd.concat([test_dfs['raw_df'], test_dfs2['raw_df']], ignore_index=True)

    actual_output = strategy.transform(df_raw=df_raw)
    pd.testing.assert_frame_equal(
        actual_output[0],
        pd.concat(
            [
                test_dfs['stage_layer_df'],
                test_dfs2['stage_layer_df']
            ],
            ignore_index=True
        )
    )
    expected_df = pd.concat(
        [
            test_dfs['stage_layer_key_values_df'],
            test_dfs2['stage_layer_key_values_df']
        ],
        ignore_index=True
    )
    # Dataframes may not be in the same order, so sort them before comparison
    actual_sorted = actual_output[1].sort_values(by=['event_id', 'parent_column_name', 'value']).reset_index(drop=True)
    expected_sorted = expected_df.sort_values(by=['event_id', 'parent_column_name','value']).reset_index(drop=True)
    pd.testing.assert_frame_equal(actual_sorted, expected_sorted)
    
    
    
def test_transform_with_empty_dataframe(setup_mocks):

    mocks = setup_mocks
    empty_df = pd.DataFrame()
    strategy = ScheduledStrategy(
        mocks["args"],
        mocks["json_config"],
        mocks["mock_glue"],
        mocks["mock_s3"],
        mocks["preprocessor"]
    )

    with pytest.raises(Exception) as exc_info:
        strategy.transform(df_raw=empty_df)
    assert "No raw records returned for processing" in str(exc_info.value)
