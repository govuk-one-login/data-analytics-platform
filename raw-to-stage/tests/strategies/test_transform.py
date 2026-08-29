import pytest
from unittest.mock import Mock
from pyspark.sql import SparkSession
from raw_to_stage_etl.strategies.scheduled_strategy import ScheduledStrategy
from raw_to_stage_etl.strategies.custom_strategy import CustomStrategy
from raw_to_stage_etl.strategies.view_strategy import ViewStrategy
from raw_to_stage_etl.util.data_preprocessing import DataPreprocessing
from test_code.util.helpers import get_pyspark_transformation_for_individual_event, get_test_json_config, get_spark


@pytest.fixture(scope="module")
def spark():
    return get_spark()


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
def test_transform_logic_outputs_stage_layer_and_key_values_dataframes(setup_mocks, strategy_cls, spark):
    mocks = setup_mocks
    test_dfs = get_pyspark_transformation_for_individual_event(
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

    # Compare stage layer
    actual_stage = actual_output[0].toPandas().reset_index(drop=True)
    expected_stage = test_dfs['stage_layer_df'].toPandas().reset_index(drop=True)
    assert actual_stage.equals(expected_stage)

    # Compare key values
    actual_kv = actual_output[1].toPandas().reset_index(drop=True)
    expected_kv = test_dfs['stage_layer_key_values_df'].toPandas().reset_index(drop=True)
    assert actual_kv.equals(expected_kv)


@pytest.mark.parametrize("strategy_cls", [ScheduledStrategy, CustomStrategy, ViewStrategy])
def test_transform_with_multiple_events(setup_mocks, strategy_cls, spark):
    mocks = setup_mocks
    test_dfs = get_pyspark_transformation_for_individual_event(
        'auth_create_account',
        mocks["preprocessor"].processed_dt,
        mocks["preprocessor"].processed_time
    )
    test_dfs2 = get_pyspark_transformation_for_individual_event(
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
    df_raw = test_dfs['raw_df'].unionByName(test_dfs2['raw_df'])

    actual_output = strategy.transform(df_raw=df_raw)

    # Compare stage layer
    expected_stage = test_dfs['stage_layer_df'].unionByName(test_dfs2['stage_layer_df'])
    actual_stage = actual_output[0].toPandas().reset_index(drop=True)
    expected_stage_pd = expected_stage.toPandas().reset_index(drop=True)
    assert actual_stage.equals(expected_stage_pd)

    # Compare key values (sort for deterministic comparison)
    expected_kv = test_dfs['stage_layer_key_values_df'].unionByName(test_dfs2['stage_layer_key_values_df'])
    actual_sorted = actual_output[1].toPandas().sort_values(by=['event_id', 'parent_column_name', 'value']).reset_index(drop=True)
    expected_sorted = expected_kv.toPandas().sort_values(by=['event_id', 'parent_column_name', 'value']).reset_index(drop=True)
    assert actual_sorted.equals(expected_sorted)


def test_transform_with_empty_dataframe(setup_mocks, spark):
    mocks = setup_mocks
    empty_df = spark.createDataFrame([], schema="event_id STRING")
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
