import pandas as pd
from raw_to_stage_etl.util.data_preprocessing import filter_null_values_and_null_strings


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
