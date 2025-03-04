import unittest

import pandas as pd
import pytest
from raw_to_stage_etl.exceptions.no_data_found_exception import NoDataFoundException
from raw_to_stage_etl.util.data_preprocessing import (add_new_column_from_struct, empty_string_to_null,
                                                      get_last_processed_time, remove_columns, remove_duplicate_rows,
                                                      remove_rows_missing_mandatory_values, rename_column_names)
from raw_to_stage_etl.util.exceptions.util_exceptions import OperationFailedException

data = [
    {
        "client_id": "dhIopwmIYTFnma-suUy",
        "component_id": "",
        "event_name": "AUTH_AUTHORISATION_REQUEST_PARSED",
        "event_timestamp_ms": 1723024771218,
        "extensions": {
            "reauthRequested": False,
            "identityRequested": False,
            "credential_trust_level": "MEDIUM_LEVEL",
            "rpSid": "session_id_provided_by_rp_request",
        },
        "restricted": {"device_information": {"encoded": "encoded_device_information"}},
        "timestamp": 1723024771,
        "user": {"user_id": "sample_user", "persistent_session_id": "7dad73487298432", "govuk_signin_journey_id": "sample_govuk_signin_journey_id"},
    },
    {
        "client_id": "dhIopwmIYTFnma-suUy",
        "component_id": None,
        "event_name": "AUTH_AUTHORISATION_REQUEST_PARSED",
        "event_timestamp_ms": 1723024771218,
        "extensions": {
            "reauthRequested": True,
            "identityRequested": True,
            "credential_trust_level": "HIGH_LEVEL",
            "rpSid": "session_id_provided_by_rp_request",
        },
        "restricted": {"device_information": {"encoded": "encoded_device_information"}},
        "timestamp": 1723024771,
        "user": {"user_id": "sample_user", "persistent_session_id": "7dad73487298432", "govuk_signin_journey_id": "sample_govuk_signin_journey_id"},
    },
]


class TestDataProcessing(unittest.TestCase):
    def test_add_new_column_from_struct(self):
        df = pd.DataFrame(data)
        fields = {"user": ["user_id", "govuk_signin_journey_id"]}
        result_df = add_new_column_from_struct(df, fields)
        assert result_df["user_user_id"].values[0] == "sample_user"
        assert result_df["user_govuk_signin_journey_id"].values[0] == "sample_govuk_signin_journey_id"

    def test_must_raise_exception_when_unable_to_add_col(self):
        df = pd.DataFrame({})
        fields = {"user": ["user_name"]}
        with pytest.raises(OperationFailedException):
            add_new_column_from_struct(df, fields)

    def test_empty_string_to_null(self):
        df = pd.DataFrame(data)
        empty_string_to_null(df, ["component_id"])
        assert df["component_id"].values[0] is None

    def test_must_raise_exception_when_unable_to_convert(self):
        df = pd.DataFrame({})
        with pytest.raises(ValueError):
            empty_string_to_null(df, "component_id")

    def test_remove_duplicate_rows(self):
        df = pd.DataFrame(data)
        result_df = remove_duplicate_rows(df, ["client_id", "event_name", "event_timestamp_ms"])
        assert len(result_df.index) == 1

    def test_remove_duplicate_rows_must_raise_exception_when_wrong_type_passed(self):
        df = pd.DataFrame(data)
        with pytest.raises(ValueError):
            remove_duplicate_rows(df, "component_id")

    def test_remove_rows_missing_mandatory_values_successfully(self):
        df = pd.DataFrame(data)
        result_df = remove_rows_missing_mandatory_values(df, ["component_id"])
        assert len(result_df.index) == 1

    def test_remove_rows_missing_mandatory_values_must_raise_exception_when_wrong_type_passed(self):
        df = pd.DataFrame(data)
        with pytest.raises(ValueError):
            remove_rows_missing_mandatory_values(df, "component_id")

    def test_rename_column_names(self):
        df = pd.DataFrame(data)
        result_df = rename_column_names(df, {"client_id": "id_of_client"})
        assert result_df.columns.__contains__("id_of_client")

    def test_rename_column_names_must_raise_exception_when_wrong_type_passed(self):
        df = pd.DataFrame(data)
        with pytest.raises(ValueError):
            rename_column_names(df, ["component_id"])

    def test_remove_columns(self):
        df = pd.DataFrame(data)
        result_df = remove_columns(df, ["client_id"], True)
        assert not result_df.columns.__contains__("client_id")

    def test_remove_columns_supress_exception_when_silent_true(self):
        df = pd.DataFrame(data)
        remove_columns(df, ["blah_blah"], True)

    def test_remove_columns_when_silent_false(self):
        df = pd.DataFrame(data)
        with pytest.raises(OperationFailedException):
            remove_columns(df, ["blah_blah"], False)

    def test_remove_columns_must_raise_exception_when_wrong_type_passed(self):
        df = pd.DataFrame(data)
        with pytest.raises(ValueError):
            remove_columns(df, "component_id", False)

    def test_get_last_processed_time(self):
        df = pd.DataFrame({"processed_time": ["1741081219", "1741081216", "1741081213"]})
        assert get_last_processed_time(df) == 1741081219

    def test_get_last_processed_time_must_raise_exception_when_none_or_empty_df(self):
        with pytest.raises(NoDataFoundException):
            get_last_processed_time(None)

        with pytest.raises(NoDataFoundException):
            get_last_processed_time(pd.DataFrame({}))

    def test_get_last_processed_time_must_raise_exception_when_missing_col_in_df(self):
        with pytest.raises(OperationFailedException):
            get_last_processed_time(pd.DataFrame({"blah": ["1234"]}))
