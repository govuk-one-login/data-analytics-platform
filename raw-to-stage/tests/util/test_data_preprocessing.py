import pandas as pd
import pytest
from raw_to_stage_etl.util.data_preprocessing import DataPreprocessing, remove_duplicate_rows


@pytest.fixture
def preprocessing():
    return DataPreprocessing({})


@pytest.fixture
def mock_config():
    return {"data_transformations": {"parse_json_list": ["user", "extensions"]}}


def test_remove_duplicate_rows(preprocessing):
    """Test parsing valid JSON objects"""
    array = [["test", 123, "e123", 1234567], ["value", 124], ["test2", 127, "e123", 1234567]]

    df = pd.DataFrame(array, columns=["name", "id", "event_id", "timestamp"])

    deduped_df, dupe_df = remove_duplicate_rows(df, ["timestamp", "event_id"])

    print(deduped_df)
    print(dupe_df)


def test_parse_string_columns_as_json_by_config(preprocessing, mock_config):
    """Test parsing valid JSON objects"""
    array = [
        ['{"dummy":1}', '{"id":"Pradeep"}', "test", 123, "e123", 1234567],
        ["extension", '{"id":"Pradeep"}', "value", 124],
        ['{"dummy":"str"}', "hi", "test2", 127, "e123", 1234567],
    ]

    df = pd.DataFrame(array, columns=["extensions", "user", "name", "id", "event_id", "timestamp"])

    result_df = preprocessing.parse_string_columns_as_json_by_config(mock_config, df)

    print(result_df)
