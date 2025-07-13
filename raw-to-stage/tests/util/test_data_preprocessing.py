import pandas as pd
import pytest
from raw_to_stage_etl.util.data_preprocessing import DataPreprocessing, remove_duplicate_rows


@pytest.fixture
def preprocessing():
    return DataPreprocessing({})


def test_parse_json_valid_object(preprocessing):
    """Test parsing valid JSON objects"""
    array = [["test", 123, "e123", 1234567], ["value", 124], ["test2", 127, "e123", 1234567]]

    df = pd.DataFrame(array, columns=["name", "id", "event_id", "timestamp"])

    deduped_df, dupe_df = remove_duplicate_rows(df, ["timestamp", "event_id"])

    print(deduped_df)
    print(dupe_df)
