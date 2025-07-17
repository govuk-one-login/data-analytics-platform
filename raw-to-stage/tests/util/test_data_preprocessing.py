import pandas as pd
import pytest
from raw_to_stage_etl.util.data_preprocessing import (DataPreprocessing, filter_null_values_and_null_strings,
                                                      remove_duplicate_rows)


@pytest.fixture
def preprocessing():
    return DataPreprocessing({})


@pytest.fixture
def mock_config():
    return {
        "data_transformations": {"parse_json_list": ["user", "extensions"]},
        "data_cleaning": {
            "duplicate_row_removal_criteria_fields": ["event_id", "timestamp"],
            "mandatory_row_removal_criteria_fields": ["event_name", "timestamp"],
        },
    }


def test_remove_rows_missing_mandatory_values_by_json_config(preprocessing, mock_config):
    array = [["test", 123, "e123"], [None, "value", 124], ["test2", 127, "e123", "1234567"], [None, 128, "e12678", None]]
    columns = ["event_name", "id", "event_id", "timestamp"]
    df = pd.DataFrame(array, columns=columns)

    filtered_df, dropped_df = preprocessing.remove_rows_missing_mandatory_values_by_json_config(mock_config, df)

    # Expected results
    expected_filtered_df = pd.DataFrame([["test2", 127, "e123", "1234567"]], columns=columns)
    expected_dropped_df = pd.DataFrame([["test", 123, "e123", None], [None, "value", 124, None], [None, 128, "e12678", None]], columns=columns)

    # Add the transformation error column to expected_dropped_df
    expected_dropped_df["_transformation_error"] = "Missing mandatory values"

    # Convert to same dtypes (only for common columns)
    common_columns = list(set(filtered_df.columns) & set(expected_filtered_df.columns))
    expected_filtered_df = expected_filtered_df.astype({col: filtered_df[col].dtype for col in common_columns})

    common_dropped_columns = list(set(dropped_df.columns) & set(expected_dropped_df.columns))
    expected_dropped_df = expected_dropped_df.astype({col: dropped_df[col].dtype for col in common_dropped_columns})

    pd.testing.assert_frame_equal(filtered_df.reset_index(drop=True), expected_filtered_df.reset_index(drop=True))
    pd.testing.assert_frame_equal(dropped_df.reset_index(drop=True), expected_dropped_df.reset_index(drop=True))


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
