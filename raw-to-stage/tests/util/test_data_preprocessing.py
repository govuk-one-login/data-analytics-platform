import pytest
import pandas as pd
from raw_to_stage_etl.util.data_preprocessing import (
    DataPreprocessing,
    add_new_column_from_struct,
    empty_string_to_null,
    remove_duplicate_rows,
    remove_rows_missing_mandatory_values,
    rename_column_names,
    remove_columns,
    convert_value_to_float_or_int,
    filter_null_values_and_null_strings
)

@pytest.fixture
def preprocessor():
    args = {}
    return DataPreprocessing(args)

def test_add_new_column_from_struct():
    df = pd.DataFrame([{"a": {"x": "1", "y": "2"}}])
    fields = {"a": ["x", "y"]}
    result = add_new_column_from_struct(df.copy(), fields)
    pd.testing.assert_frame_equal(result, pd.DataFrame({"a": [{"x": "1", "y": "2"}], "a_x": ["1"], "a_y": ["2"]}))
    
def test_add_new_column_from_struct_empty():
    df = pd.DataFrame([{"a": {}}])
    fields = {"a": ["x", "y"]}
    result = add_new_column_from_struct(df.copy(), fields)
    pd.testing.assert_frame_equal(result, pd.DataFrame({"a": [{}], "a_x": [None], "a_y": [None]}))
    
def test_empty_string_to_null():
    df = pd.DataFrame({"col": ["", " ", "val"]})
    result = empty_string_to_null(df.copy(), ["col"])
    pd.testing.assert_frame_equal(result, pd.DataFrame({"col": [None, None, "val"]}))
def test_empty_string_to_null_no_change():
    df = pd.DataFrame({"col": ["val", "test"]})
    result = empty_string_to_null(df.copy(), ["col"])
    pd.testing.assert_frame_equal(result, df)
    
def test_remove_duplicate_rows():
    df = pd.DataFrame({"a": [1, 1, 2], "b": [2, 2, 3]})
    result = remove_duplicate_rows(df.copy(), ["a", "b"])
    pd.testing.assert_frame_equal(result.reset_index(drop=True), pd.DataFrame({"a": [1, 2], "b": [2, 3]}))

def test_remove_duplicate_rows_empty():
    df = pd.DataFrame({"a": [], "b": []})
    result = remove_duplicate_rows(df.copy(), ["a", "b"])
    pd.testing.assert_frame_equal(result, df)
    
def test_remove_rows_missing_mandatory_values():
    df = pd.DataFrame({"a": [1, None, 3], "b": [2, 2, None]})
    result = remove_rows_missing_mandatory_values(df.copy(), ["a", "b"])
    assert len(result) == 1

def test_rename_column_names():
    df = pd.DataFrame({"old": [1, 2]})
    result = rename_column_names(df.copy(), {"old": "new"})
    pd.testing.assert_frame_equal(result, pd.DataFrame({"new": [1, 2]}))

def test_remove_columns():
    df = pd.DataFrame({"a": [1], "b": [2]})
    result = remove_columns(df.copy(), ["a"], silent=True)
    pd.testing.assert_frame_equal(result, pd.DataFrame({"b": [2]}))
    
def test_remove_columns_empty():
    df = pd.DataFrame({"a": [1], "b": [2]})
    result = remove_columns(df.copy(), [], silent=True)
    pd.testing.assert_frame_equal(result, df)   
    
def test_convert_value_to_float_or_int():
    assert convert_value_to_float_or_int("2.0") == 2
    assert convert_value_to_float_or_int("2.5") == 2.5
    assert convert_value_to_float_or_int(3.0) == 3
    assert convert_value_to_float_or_int("abc") == "abc"

def test_add_new_column(preprocessor):
    df = pd.DataFrame({"x": [1]})
    fields = {"processed_dt": None, "processed_time": None}
    result = preprocessor.add_new_column(df.copy(), fields)
    pd.testing.assert_frame_equal(
        result,
        pd.DataFrame({
            "x": [1],
            "processed_dt": [preprocessor.processed_dt],
            "processed_time": [preprocessor.processed_time]
        })
    )   

def test_add_duplicate_column(preprocessor):
    df = pd.DataFrame({"a": [1]})
    fields = {"b": "a"}
    result = preprocessor.add_duplicate_column(df.copy(), fields)
    assert "b" in result.columns and (result["b"] == result["a"]).all()
    
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
