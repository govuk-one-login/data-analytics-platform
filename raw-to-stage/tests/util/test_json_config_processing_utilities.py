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
    return get_test_json_config('scheduled')

def test_generate_raw_select_filter_returns_sql_for_scheduled(json_config):
    sql = generate_raw_select_filter(
        json_config,
        database="raw_db",
        table="raw_table",
        filter_processed_dt=20240602,
        filter_timestamp=1234567890
    )
    assert isinstance(sql, str)
    assert sql == 'select * from "raw_db"."raw_table" where cast(concat(substr(datecreated, 6,4),substr(datecreated, 17, 2),substr(datecreated, 24, 2)) as int) >= 20240601 AND cast(timestamp as int) > 1234567890'


def test_generate_raw_select_filter_returns_sql_for_custom(json_config):
    json_config = get_test_json_config('custom')
    sql = generate_raw_select_filter(
        json_config,
        database="raw_db",
        table="raw_table",
        filter_processed_dt=20240602,
        filter_timestamp=1234567890
    )
    assert isinstance(sql, str)
    expected_sql = """select * from (select *,
                                    row_number() over (
                                            partition by event_id
                                            order by datecreated desc
                            from \"raw_db\".\"raw_table\" as t  where event_id in ('xxxx','xxxx')) where row_num = 1"""
                            
    print(sql)
    assert sql == expected_sql

def test_generate_raw_select_filter_returns_sql_for_view(json_config):
    json_config = get_test_json_config('view')
    sql = generate_raw_select_filter(
        json_config,
        database="raw_db",
        table="raw_table",
        filter_processed_dt=20240602,
        filter_timestamp=1234567890
    )
    
    assert isinstance(sql, str)
    assert sql == 'select * from "raw_db"."some_view_name"'
    
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
