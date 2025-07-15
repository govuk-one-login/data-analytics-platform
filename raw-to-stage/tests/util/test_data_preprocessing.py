import pandas as pd
import pytest
from raw_to_stage_etl.util.data_preprocessing import (DataPreprocessing, filter_null_values_and_null_strings,
                                                      remove_duplicate_rows)


def test_filter_null_values_and_null_strings():
    # Should drop nulls and null strings.
    input_data = [
        ["test", 123, "e123", 1234567, "key1", None],
        ["value", 124, "e125", 1234568, "key3", "value1"],
        ["test2", 127, "e123", 1234567, "key2", "null"],
    ]
    columns = ["name", "id", "event_id", "timestamp", "key", "value"]
    df = pd.DataFrame(input_data, columns=columns)
    expected_df = pd.DataFrame([["value", 124, "e125", 1234568, "key3", "value1"]], columns=columns)
    result = filter_null_values_and_null_strings(df, "value")

    pd.testing.assert_frame_equal(result.reset_index(drop=True), expected_df.reset_index(drop=True))


@pytest.fixture
def preprocessing():
    return DataPreprocessing({})


def test_remove_duplicate_rows(preprocessing):
    """Test parsing valid JSON objects"""
    array = [["test", 123, "e123", 1234567], ["value", 124], ["test2", 127, "e123", 1234567]]

    df = pd.DataFrame(array, columns=["name", "id", "event_id", "timestamp"])

    deduped_df, dupe_df = remove_duplicate_rows(df, ["timestamp", "event_id"])
    print("Input DF")
    print(df)
    print("De-Duplicated")
    print(deduped_df)
    print("Duplicates")
    print(dupe_df)


def test_parse_string_columns_as_json_by_config(preprocessing, mock_config):
    """Test parsing valid JSON objects"""
    array = [
        ['{"dummy":1}', '{"id":"Pradeep"}', "test", 123, "e123", 1234567],
        ["abc", '{"id":"Pradeep"}', "value", 124],
        ['{"dummy":"str"}', "hi", "test2", 127, "e123", 1234567],
    ]

    df = pd.DataFrame(array, columns=["extensions", "user", "name", "id", "event_id", "timestamp"])

    result_df = preprocessing.parse_string_columns_as_json_by_config(mock_config, df)

    print(result_df)


@pytest.fixture
def mock_config():
    return {"data_transformations": {"parse_json_list": ["user", "extensions"]}}
