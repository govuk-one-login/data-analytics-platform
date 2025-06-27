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
)

@pytest.fixture
def preprocessor():
    args = {}
    return DataPreprocessing(args)

def test_add_new_column_from_struct():
    df = pd.DataFrame([{"a": {"x": "1", "y": "2"}}])
    fields = {"a": ["x", "y"]}
    result = add_new_column_from_struct(df.copy(), fields)
    assert "a_x" in result.columns and "a_y" in result.columns

def test_empty_string_to_null():
    df = pd.DataFrame({"col": ["", " ", "val"]})
    result = empty_string_to_null(df.copy(), ["col"])
    assert result["col"].isnull().sum() == 2

def test_remove_duplicate_rows():
    df = pd.DataFrame({"a": [1, 1, 2], "b": [2, 2, 3]})
    result = remove_duplicate_rows(df.copy(), ["a", "b"])
    assert len(result) == 2

def test_remove_rows_missing_mandatory_values():
    df = pd.DataFrame({"a": [1, None, 3], "b": [2, 2, None]})
    result = remove_rows_missing_mandatory_values(df.copy(), ["a", "b"])
    assert len(result) == 1

def test_rename_column_names():
    df = pd.DataFrame({"old": [1, 2]})
    result = rename_column_names(df.copy(), {"old": "new"})
    assert "new" in result.columns

def test_remove_columns():
    df = pd.DataFrame({"a": [1], "b": [2]})
    result = remove_columns(df.copy(), ["a"], silent=True)
    assert "a" not in result.columns

def test_convert_value_to_float_or_int():
    assert convert_value_to_float_or_int("2.0") == 2
    assert convert_value_to_float_or_int("2.5") == 2.5
    assert convert_value_to_float_or_int(3.0) == 3
    assert convert_value_to_float_or_int("abc") == "abc"

def test_add_new_column(preprocessor):
    df = pd.DataFrame({"x": [1]})
    fields = {"processed_dt": None, "processed_time": None}
    result = preprocessor.add_new_column(df.copy(), fields)
    assert "processed_dt" in result.columns and "processed_time" in result.columns

def test_add_duplicate_column(preprocessor):
    df = pd.DataFrame({"a": [1]})
    fields = {"b": "a"}
    result = preprocessor.add_duplicate_column(df.copy(), fields)
    assert "b" in result.columns and (result["b"] == result["a"]).all()
