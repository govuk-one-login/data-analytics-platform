import awswrangler as wr
import boto3
import numpy as np
import pandas as pd
import pytest
from moto import mock_aws
from raw_to_stage_etl.clients.glue_table_query_and_write import GlueTableQueryAndWrite, does_glue_table_exist
from raw_to_stage_etl.util.exceptions.util_exceptions import SQLException

CATALOG = "RAW_CATALOG"
DATABASE = "RAW_DB"
TABLE = "RAW_TABLE"
CHUNKSIZE = 2
SAMPLE_DATA = {"col1": [1, 2, 3, 4], "col2": ["a", "b", "c", "d"]}


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
        with pytest.raises(SQLException):
            does_glue_table_exist(DATABASE, TABLE)

    @pytest.fixture
    def mock_db_query_result(self, monkeypatch):
        mock_df = pd.DataFrame(SAMPLE_DATA)

        def mock_read_sql_query(*args, **kwargs):
            return np.array_split(mock_df, CHUNKSIZE)

        monkeypatch.setattr(wr.athena, "read_sql_query", mock_read_sql_query)

    def test_should_query_athena_successfully(self, mock_db_query_result):
        query = f"select * from {TABLE}"
        dfs = self.glue_wrapper.query_glue_table(DATABASE, query, CHUNKSIZE)
        for df in dfs:
            assert df.shape[0] == CHUNKSIZE

    def test_should_raise_exception_when_unable_to_query_athena(self):
        with pytest.raises(SQLException):
            query = f"select * from {TABLE}"
            self.glue_wrapper.query_glue_table(DATABASE, query, CHUNKSIZE)

    @mock_aws
    def test_should_write_to_table_successfully(self):
        df = pd.DataFrame(SAMPLE_DATA)
        boto3.client("s3").create_bucket(Bucket="bucket_name", CreateBucketConfiguration={"LocationConstraint": "eu-west-2"})
        boto3.client("glue").create_database(CatalogId=CATALOG, DatabaseInput={"Name": DATABASE})
        result = self.glue_wrapper.write_to_glue_table(
            dataframe=df,
            s3_path="s3://bucket_name/SAMPLE_DATA",
            dataset=True,
            database=DATABASE,
            insert_mode="overwrite",
            table=TABLE,
            dtype={"col1": "INT", "col2": "CHAR"},
            partition_cols=["col1"],
        )
        # Expect 4 paths as mock data has 4 distinct values for col1 which is specified as partition column.
        assert len(result["paths"]) == 4

    def test_should_raise_exception_when_unable_to_write(self):
        df = pd.DataFrame(SAMPLE_DATA)
        with pytest.raises(SQLException):
            self.glue_wrapper.write_to_glue_table(
                dataframe=df,
                s3_path="s3://bucket_name/SAMPLE_DATA",
                dataset=True,
                database=DATABASE,
                insert_mode="overwrite",
                table=TABLE,
                dtype={"col1": "INT", "col2": "CHAR"},
                partition_cols=["col1"],
            )
