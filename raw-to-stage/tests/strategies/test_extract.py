import pytest
from raw_to_stage_etl.strategies.scheduled_strategy import ScheduledStrategy
from raw_to_stage_etl.strategies.backfill_strategy import BackfillStrategy
from raw_to_stage_etl.strategies.custom_strategy import CustomStrategy
from raw_to_stage_etl.strategies.view_strategy import ViewStrategy
from raw_to_stage_etl.util.data_preprocessing import DataPreprocessing
from test_code.util.helpers import get_test_json_config

@pytest.fixture
def setup_mocks(mocker):
    json_config = get_test_json_config('scheduled')
    mock_glue = mocker.Mock()
    mock_s3 = mocker.Mock()
    preprocessor = DataPreprocessing(mock_glue)
    args = {
        "raw_database": "raw_db",
        "raw_source_table": "raw_table",
        "stage_database": "stage_db",
        "stage_target_table": "stage_table"
    }
    return {
        "json_config": json_config,
        "mock_glue": mock_glue,
        "mock_s3": mock_s3,
        "preprocessor": preprocessor,
        "args": args
    }

def test_scheduled_strategy_extract(mocker, setup_mocks):
    mocks = setup_mocks
    mocks["mock_glue"].get_raw_data.return_value = "df"
    mocker.patch("raw_to_stage_etl.strategies.scheduled_strategy.get_max_processed_dt", return_value="20240601")
    mocker.patch("raw_to_stage_etl.strategies.scheduled_strategy.get_max_timestamp", return_value=1234567890)
    strategy = ScheduledStrategy(
        mocks["args"],
        mocks["json_config"],
        mocks["mock_glue"],
        mocks["mock_s3"],
        mocks["preprocessor"]
    )
    result = strategy.extract()
    assert result == "df"
    assert mocks["mock_glue"].get_raw_data.called

def test_backfill_strategy_extract(mocker, setup_mocks):
    mocks = setup_mocks
    mocks["mock_glue"].get_raw_data.return_value = "df"
    mocker.patch("raw_to_stage_etl.strategies.backfill_strategy.get_last_processed_time", return_value=1)
    mocker.patch("raw_to_stage_etl.strategies.backfill_strategy.get_all_previous_processed_dts", return_value=[20240601, 20240602])
    mocker.patch("raw_to_stage_etl.strategies.backfill_strategy.get_all_processed_times_per_day", return_value=[1, 2])
    mocker.patch("raw_to_stage_etl.strategies.backfill_strategy.get_penultimate_processed_dt", return_value=20240601)
    mocker.patch("raw_to_stage_etl.strategies.backfill_strategy.get_min_timestamp_from_previous_run", return_value=1234567890)
    strategy = BackfillStrategy(
        mocks["args"],
        mocks["json_config"],
        mocks["mock_glue"],
        mocks["mock_s3"],
        mocks["preprocessor"],
        max_timestamp=1234567890,
        max_processed_dt=20240602
    )
    result = strategy.extract()
    assert result == "df"
    assert mocks["mock_glue"].get_raw_data.called

def test_custom_strategy_extract(mocker, setup_mocks):
    mocks = setup_mocks
    mocks["mock_glue"].get_raw_data.return_value = "df"
    strategy = CustomStrategy(
        mocks["args"],
        mocks["json_config"],
        mocks["mock_glue"],
        mocks["mock_s3"],
        mocks["preprocessor"]
    )
    result = strategy.extract()
    assert result == "df"
    assert mocks["mock_glue"].get_raw_data.called

def test_view_strategy_extract(mocker, setup_mocks):
    mocks = setup_mocks
    mocks["mock_glue"].get_raw_data.return_value = "df"
    strategy = ViewStrategy(
        mocks["args"],
        mocks["json_config"],
        mocks["mock_glue"],
        mocks["mock_s3"],
        mocks["preprocessor"]
    )
    result = strategy.extract()
    assert result == "df"
    assert mocks["mock_glue"].get_raw_data.called
