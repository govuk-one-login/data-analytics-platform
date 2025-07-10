import pandas as pd
import pytest
from raw_to_stage_etl.util.data_preprocessing import (DataPreprocessing, add_new_column_from_struct,
                                                      empty_string_to_null, remove_duplicate_rows,
                                                      remove_rows_missing_mandatory_values, rename_column_names)


@pytest.fixture
def sample_df():
    return pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", "", "Charlie"], "nested": [{"value": "test1"}, {"value": ""}, None]})


@pytest.fixture
def preprocessing():
    return DataPreprocessing({})


def test_add_new_column_from_struct_success():
    df = pd.DataFrame({"nested": [{"value": "test1"}, {"value": "test2"}]})
    fields = {"nested": ["value"]}

    success_df, error_df = add_new_column_from_struct(df, fields)

    assert len(success_df) == 2
    assert "nested_value" in success_df.columns
    assert error_df.empty


def test_add_new_column_from_struct_with_errors():
    df = pd.DataFrame({"nested": [{"value": "test1"}, None, {"value": "test3"}]})
    fields = {"nested": ["value"]}

    success_df, error_df = add_new_column_from_struct(df, fields)

    assert len(success_df) == 3  # All records processed (None handled gracefully)
    assert "nested_value" in success_df.columns
    assert success_df.iloc[1]["nested_value"] is None  # None nested data results in None value
    assert error_df.empty  # No actual errors in this case


def test_empty_string_to_null_success():
    df = pd.DataFrame({"name": ["Alice", "", "Charlie"]})
    fields = ["name"]

    success_df, error_df = empty_string_to_null(df, fields)

    assert len(success_df) == 3
    assert success_df.iloc[1]["name"] is None  # Empty string converted to None
    assert error_df.empty


def test_remove_duplicate_rows_success():
    df = pd.DataFrame({"id": [1, 1, 2], "name": ["Alice", "Alice", "Bob"]})
    fields = ["id", "name"]

    success_df, error_df = remove_duplicate_rows(df, fields)

    assert len(success_df) == 2  # One duplicate removed
    assert error_df.empty


def test_remove_rows_missing_mandatory_values_success():
    df = pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", None, "Charlie"]})
    fields = ["name"]

    success_df, error_df = remove_rows_missing_mandatory_values(df, fields)

    assert len(success_df) == 2  # Records with non-null names
    assert len(error_df) == 1  # Record with null name
    assert error_df.iloc[0]["_transformation_error"] == "Missing mandatory values"


def test_rename_column_names_success():
    df = pd.DataFrame({"old_name": [1, 2, 3]})
    fields = {"old_name": "new_name"}

    success_df, error_df = rename_column_names(df, fields)

    assert "new_name" in success_df.columns
    assert "old_name" not in success_df.columns
    assert error_df.empty


def test_data_preprocessing_add_duplicate_column_success(preprocessing):
    df = pd.DataFrame({"original": [1, 2, 3]})
    fields = {"duplicate": "original"}

    success_df, error_df = preprocessing.add_duplicate_column(df, fields)

    assert "duplicate" in success_df.columns
    assert (success_df["duplicate"] == success_df["original"]).all()
    assert error_df.empty


def test_data_preprocessing_add_new_column_success(preprocessing):
    df = pd.DataFrame({"id": [1, 2, 3]})
    fields = {"processed_dt": None, "processed_time": None}

    success_df, error_df = preprocessing.add_new_column(df, fields)

    assert "processed_dt" in success_df.columns
    assert "processed_time" in success_df.columns
    assert success_df["processed_dt"].iloc[0] == preprocessing.processed_dt
    assert error_df.empty


def test_invalid_field_structure():
    df = pd.DataFrame({"id": [1, 2, 3]})

    with pytest.raises(Exception):
        add_new_column_from_struct(df, "invalid_fields")  # Should be dict

    with pytest.raises(Exception):
        empty_string_to_null(df, "invalid_fields")  # Should be list
