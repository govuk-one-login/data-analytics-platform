import pytest
from raw_to_stage_etl.util.json_config_processing_utilities import (
    generate_raw_select_filter,
    extract_and_validate_filters,
    extract_element_by_name,
    extract_element_by_name_and_validate,
    JSONReadException,
)
from test_code.util.helpers import get_test_json_config

@pytest.fixture
def json_config():
    # Use the scheduled config for general tests, override in test if needed
    return get_test_json_config('scheduled')

def test_generate_raw_select_filter_returns_sql(json_config):
    sql = generate_raw_select_filter(
        json_config,
        database="raw_db",
        table="raw_table",
        filter_processed_dt=20240602,
        filter_timestamp=1234567890
    )
    assert isinstance(sql, str)
    assert "select" in sql.lower()
    assert "raw_db" in sql
    assert "raw_table" in sql or '"' in sql  # Table or view

def test_extract_and_validate_filters_returns_tuple(json_config):
    filters = extract_and_validate_filters(json_config)
    assert isinstance(filters, tuple)
    assert len(filters) == 6

def test_extract_element_by_name_finds_value(json_config):
    # Should find a known element in the config
    value = extract_element_by_name(json_config, "filter", "event_processing_selection_criteria")
    assert value is not None

def test_extract_element_by_name_returns_none_for_missing(json_config):
    value = extract_element_by_name(json_config, "not_a_real_key", "not_a_real_parent")
    assert value is None

def test_extract_element_by_name_and_validate_success(json_config):
    value = extract_element_by_name_and_validate(json_config, "filter", "event_processing_selection_criteria")
    assert value is not None

def test_extract_element_by_name_and_validate_raises(json_config):
    with pytest.raises(ValueError):
        extract_element_by_name_and_validate(json_config, "not_a_real_key", "not_a_real_parent")

def test_generate_raw_select_filter_invalid_json():
    with pytest.raises(JSONReadException):
        generate_raw_select_filter("not a dict", "db", "table", 1, 1)
