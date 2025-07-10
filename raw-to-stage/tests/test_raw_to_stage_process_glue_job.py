from unittest.mock import MagicMock, patch

import pytest
from raw_to_stage_etl import raw_to_stage_process_glue_job


@pytest.fixture
def mock_args():
    return {
        "JOB_NAME": "test-job",
        "LOG_LEVEL": "INFO",
        "config_bucket": "test-bucket",
        "config_key_path": "config.json",
        "txma_raw_dedup_view_key_path": "view.sql",
        "workgroup": "test-workgroup",
        "raw_database": "raw_db",
        "raw_source_table": "raw_table",
        "stage_database": "stage_db",
        "stage_target_table": "stage_table",
        "stage_target_key_value_table": "stage_kv_table",
        "stage_bucket": "stage-bucket",
    }


@pytest.fixture
def mock_json_config():
    return {"event_processing_testing_criteria": {"enabled": False}, "event_processing_view_criteria": {"enabled": False}}


@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.getResolvedOptions")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.S3ReadWrite")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.GlueTableQueryAndWrite")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.DataPreprocessing")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.ErrorHandler")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.RawToStageProcessor")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.ScheduledStrategy")
def test_main_scheduled_strategy(
    mock_scheduled_strategy, mock_processor, mock_error_handler, mock_preprocessing, mock_glue, mock_s3, mock_get_args, mock_args, mock_json_config
):
    # Setup mocks
    mock_get_args.return_value = mock_args
    mock_s3_instance = MagicMock()
    mock_s3.return_value = mock_s3_instance
    mock_s3_instance.read_json.return_value = mock_json_config

    mock_error_handler_instance = MagicMock()
    mock_error_handler.return_value = mock_error_handler_instance
    mock_error_handler_instance.write_failed_records_to_s3.return_value = True
    mock_error_handler_instance.get_failed_record_count.return_value = 0

    mock_strategy_instance = MagicMock()
    mock_scheduled_strategy.return_value = mock_strategy_instance

    mock_processor_instance = MagicMock()
    mock_processor.return_value = mock_processor_instance

    # Run main function
    raw_to_stage_process_glue_job.main()

    # Verify ErrorHandler was initialized with S3 client and stage bucket
    mock_error_handler.assert_called_once_with(mock_s3_instance, mock_args["stage_bucket"])

    # Verify processor was created with error handler
    mock_processor.assert_called_with(mock_args, mock_strategy_instance, mock_error_handler_instance)

    # Verify error handler methods were called
    mock_error_handler_instance.write_failed_records_to_s3.assert_called_once()
    mock_error_handler_instance.get_failed_record_count.assert_called_once()


@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.getResolvedOptions")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.S3ReadWrite")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.GlueTableQueryAndWrite")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.DataPreprocessing")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.ErrorHandler")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.RawToStageProcessor")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.CustomStrategy")
def test_main_custom_strategy(mock_custom_strategy, mock_processor, mock_error_handler, mock_preprocessing, mock_glue, mock_s3, mock_get_args, mock_args):
    # Setup for custom strategy
    custom_config = {"event_processing_testing_criteria": {"enabled": True}, "event_processing_view_criteria": {"enabled": False}}

    mock_get_args.return_value = mock_args
    mock_s3_instance = MagicMock()
    mock_s3.return_value = mock_s3_instance
    mock_s3_instance.read_json.return_value = custom_config

    mock_error_handler_instance = MagicMock()
    mock_error_handler.return_value = mock_error_handler_instance

    mock_strategy_instance = MagicMock()
    mock_custom_strategy.return_value = mock_strategy_instance

    mock_processor_instance = MagicMock()
    mock_processor.return_value = mock_processor_instance

    raw_to_stage_process_glue_job.main()

    # Verify CustomStrategy was used
    mock_custom_strategy.assert_called_once()
    mock_processor.assert_called_with(mock_args, mock_strategy_instance, mock_error_handler_instance)


@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.getResolvedOptions")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.S3ReadWrite")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.GlueTableQueryAndWrite")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.DataPreprocessing")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.ErrorHandler")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.RawToStageProcessor")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.ViewStrategy")
def test_main_view_strategy(mock_view_strategy, mock_processor, mock_error_handler, mock_preprocessing, mock_glue, mock_s3, mock_get_args, mock_args):
    # Setup for view strategy
    view_config = {"event_processing_testing_criteria": {"enabled": False}, "event_processing_view_criteria": {"enabled": True}}

    mock_get_args.return_value = mock_args
    mock_s3_instance = MagicMock()
    mock_s3.return_value = mock_s3_instance
    mock_s3_instance.read_json.return_value = view_config

    mock_error_handler_instance = MagicMock()
    mock_error_handler.return_value = mock_error_handler_instance

    mock_strategy_instance = MagicMock()
    mock_view_strategy.return_value = mock_strategy_instance

    mock_processor_instance = MagicMock()
    mock_processor.return_value = mock_processor_instance

    raw_to_stage_process_glue_job.main()

    # Verify ViewStrategy was used
    mock_view_strategy.assert_called_once()
    mock_processor.assert_called_with(mock_args, mock_strategy_instance, mock_error_handler_instance)


@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.getResolvedOptions")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.S3ReadWrite")
@patch("raw_to_stage_etl.raw_to_stage_process_glue_job.sys.exit")
def test_main_exception_handling(mock_exit, mock_s3, mock_get_args, mock_args):
    mock_get_args.return_value = mock_args
    mock_s3_instance = MagicMock()
    mock_s3.return_value = mock_s3_instance
    mock_s3_instance.read_json.side_effect = Exception("Test exception")

    raw_to_stage_process_glue_job.main()

    # Verify sys.exit was called due to exception
    mock_exit.assert_called_once()


def test_get_job_type_custom():
    config = {"event_processing_testing_criteria": {"enabled": True}}
    result = raw_to_stage_process_glue_job.get_job_type(config)
    assert result == "CUSTOM"


def test_get_job_type_view():
    config = {"event_processing_testing_criteria": {"enabled": False}, "event_processing_view_criteria": {"enabled": True}}
    result = raw_to_stage_process_glue_job.get_job_type(config)
    assert result == "VIEW"


def test_get_job_type_scheduled():
    config = {"event_processing_testing_criteria": {"enabled": False}, "event_processing_view_criteria": {"enabled": False}}
    result = raw_to_stage_process_glue_job.get_job_type(config)
    assert result == "SCHEDULED"


def test_get_job_type_missing_config():
    config = {}
    with pytest.raises(ValueError):
        raw_to_stage_process_glue_job.get_job_type(config)
