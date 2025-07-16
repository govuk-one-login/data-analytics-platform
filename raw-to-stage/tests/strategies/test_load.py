import pytest
from unittest.mock import call
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
    args = {
        "stage_database": "stage_database",
        "stage_target_table": "stage_table",
        "stage_target_key_value_table": "stage_key_values",
        "stage_bucket": "stage_bucket"
    }
    return {
        "json_config": json_config,
        "mock_glue": mock_glue,
        "mock_s3": mock_s3,
        "preprocessor": preprocessor,
        "args": args
    }

@pytest.mark.parametrize("strategy_cls", [ScheduledStrategy, CustomStrategy, ViewStrategy])
def test_loads_correct_dfs(setup_mocks, strategy_cls):
    mocks = setup_mocks
    test_dfs = get_pandas_transformation_for_individual_event(
        'auth_create_account',
        mocks["preprocessor"].processed_dt,
        mocks["preprocessor"].processed_time
    )
    mocks["mock_glue"].write_to_glue_table.return_value = 'success'
    mocks["mock_s3"].write_json.return_value = 'success'

    strategy = strategy_cls(
        mocks["args"],
        mocks["json_config"],
        mocks["mock_glue"],
        mocks["mock_s3"],
        mocks["preprocessor"]
    )

    strategy.load(
        df_stage=test_dfs['stage_layer_df'],
        df_key_values=test_dfs['stage_layer_key_values_df']
    )

    assert mocks["mock_glue"].write_to_glue_table.call_count == 2
    assert mocks["mock_s3"].write_json.call_count == 2

    args = mocks["args"]
    json_config = mocks["json_config"]

    expected_calls = [
        call(
            test_dfs['stage_layer_key_values_df'],
            f's3://{args["stage_bucket"]}/{args["stage_target_key_value_table"]}/',
            True,
            args['stage_database'],
            "append",
            args['stage_target_key_value_table'],
            json_config['key_value_schema']['columns'],
            json_config['key_value_schema']['partition_columns']
        ),
        call(
            test_dfs['stage_layer_df'],
            f's3://{args["stage_bucket"]}/{args["stage_target_table"]}/',
            True,
            args['stage_database'],
            "append",
            args['stage_target_table'],
            json_config['stage_schema']['columns'],
            json_config['stage_schema']['partition_columns']
        )
    ]
    assert mocks["mock_glue"].write_to_glue_table.call_args_list == expected_calls
    
