import awswrangler as wr
import boto3
import numpy as np
import pandas as pd
import pytest
from moto import mock_aws
from raw_to_stage_etl.clients.glue_table_query_and_write import GlueTableQueryAndWrite, does_glue_table_exist
from raw_to_stage_etl.util.exceptions.util_exceptions import QueryException

CATALOG = "RAW_CATALOG"
DATABASE = "RAW_DB"
TABLE = "RAW_TABLE"
CHUNKSIZE = 2


class TestGlueTableQueryAndWrite:
    def setup_method(self):
        args = {"raw_database": DATABASE}
        self.glue_wrapper = GlueTableQueryAndWrite(args)

    @mock_aws
    def test_should_return_true_when_table_exists(self):
        glue_client = boto3.client("glue")
        glue_client.create_database(CatalogId=CATALOG, DatabaseInput={"Name": DATABASE})
        glue_client.create_table(DatabaseName=DATABASE, TableInput={"Name": TABLE})
        assert does_glue_table_exist(DATABASE, TABLE)

    @mock_aws
    def test_should_return_false_when_table__doesnt_exist(self):
        assert not does_glue_table_exist(DATABASE, TABLE)

    def test_should_raise_exception_when_unable_to_query(self):
        with pytest.raises(QueryException):
            does_glue_table_exist(DATABASE, TABLE)

    @pytest.fixture
    def mock_db_query_result(self, monkeypatch):
        # Mock Athena data
        mock_data = {"col1": [1, 2, 3, 4], "col2": ["a", "b", "c", "d"]}
        mock_df = pd.DataFrame(mock_data)

        def mock_read_sql_query(*args, **kwargs):
            return np.array_split(mock_df, CHUNKSIZE)

        monkeypatch.setattr(wr.athena, "read_sql_query", mock_read_sql_query)

    @mock_aws
    def test_should_query_athena_successfully(self, mock_db_query_result):
        query = f"select * from {TABLE}"
        dfs = self.glue_wrapper.query_glue_table(DATABASE, query, CHUNKSIZE)
        for df in dfs:
            assert df.shape[0] == CHUNKSIZE

    def test_should_raise_exception_when_unable_to_query_athena(self):
        with pytest.raises(QueryException):
            query = f"select * from {TABLE}"
            self.glue_wrapper.query_glue_table(DATABASE, query, CHUNKSIZE)
