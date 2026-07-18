import pytest
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
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


@pytest.fixture(scope="module")
def spark():
    return SparkSession.builder.master("local[1]").appName("test").getOrCreate()


@pytest.fixture
def preprocessor():
    args = {}
    return DataPreprocessing(args)


def test_add_new_column_from_struct(spark):
    df = spark.createDataFrame([('{ "x": "1", "y": "2"}',)], ["a"])
    fields = {"a": ["x", "y"]}
    result = add_new_column_from_struct(df, fields)
    row = result.collect()[0]
    assert row["a_x"] == "1"
    assert row["a_y"] == "2"


def test_add_new_column_from_struct_empty(spark):
    df = spark.createDataFrame([('{ "z": "3"}',)], ["a"])
    fields = {"a": ["x", "y"]}
    result = add_new_column_from_struct(df, fields)
    row = result.collect()[0]
    assert row["a_x"] is None
    assert row["a_y"] is None


def test_empty_string_to_null(spark):
    df = spark.createDataFrame([("",), (" ",), ("val",)], ["col"])
    result = empty_string_to_null(df, ["col"])
    rows = result.collect()
    assert rows[0]["col"] is None
    assert rows[1]["col"] is None
    assert rows[2]["col"] == "val"


def test_empty_string_to_null_no_change(spark):
    df = spark.createDataFrame([("val",), ("test",)], ["col"])
    result = empty_string_to_null(df, ["col"])
    rows = result.collect()
    assert rows[0]["col"] == "val"
    assert rows[1]["col"] == "test"


def test_remove_duplicate_rows(spark):
    df = spark.createDataFrame([(1, 2), (1, 2), (2, 3)], ["a", "b"])
    result = remove_duplicate_rows(df, ["a", "b"])
    assert result.count() == 2


def test_remove_duplicate_rows_empty(spark):
    df = spark.createDataFrame([], schema="a INT, b INT")
    result = remove_duplicate_rows(df, ["a", "b"])
    assert result.count() == 0


def test_remove_rows_missing_mandatory_values(spark):
    df = spark.createDataFrame([(1, 2), (None, 2), (3, None)], ["a", "b"])
    result = remove_rows_missing_mandatory_values(df, ["a", "b"])
    assert result.count() == 1


def test_rename_column_names(spark):
    df = spark.createDataFrame([(1,), (2,)], ["old"])
    result = rename_column_names(df, {"old": "new"})
    assert "new" in result.columns
    assert "old" not in result.columns


def test_remove_columns(spark):
    df = spark.createDataFrame([(1, 2)], ["a", "b"])
    result = remove_columns(df, ["a"], silent=True)
    assert "a" not in result.columns
    assert "b" in result.columns


def test_remove_columns_empty(spark):
    df = spark.createDataFrame([(1, 2)], ["a", "b"])
    result = remove_columns(df, [], silent=True)
    assert set(result.columns) == {"a", "b"}


def test_convert_value_to_float_or_int():
    assert convert_value_to_float_or_int("2.0") == 2
    assert convert_value_to_float_or_int("2.5") == 2.5
    assert convert_value_to_float_or_int(3.0) == 3
    assert convert_value_to_float_or_int("abc") == "abc"


def test_add_new_column(preprocessor, spark):
    df = spark.createDataFrame([(1,)], ["x"])
    fields = {"processed_dt": None, "processed_time": None}
    result = preprocessor.add_new_column(df, fields)
    row = result.collect()[0]
    assert row["processed_dt"] == preprocessor.processed_dt
    assert row["processed_time"] == preprocessor.processed_time


def test_add_duplicate_column(preprocessor, spark):
    df = spark.createDataFrame([(1,)], ["a"])
    fields = {"b": "a"}
    result = preprocessor.add_duplicate_column(df, fields)
    row = result.collect()[0]
    assert "b" in result.columns
    assert row["b"] == row["a"]


def test_filter_null_values_and_null_strings(preprocessor, spark):
    input_data = [
        ("test", 123, "e123", 1234567, "key1", None),
        ("value", 124, "e125", 1234568, "key3", "value1"),
        ("test2", 127, "e123", 1234567, "key2", "null"),
    ]
    columns = ["name", "id", "event_id", "timestamp", "key", "value"]
    df = spark.createDataFrame(input_data, columns)
    result = preprocessor.filter_null_values_and_null_strings(df, "value")

    assert result.count() == 1
    row = result.collect()[0]
    assert row["value"] == "value1"
