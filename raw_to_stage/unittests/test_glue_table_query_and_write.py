import boto3
import pytest
from moto import mock_aws
from raw_to_stage_etl.clients.glue_table_query_and_write import GlueTableQueryAndWrite, does_glue_table_exist
from raw_to_stage_etl.util.exceptions.util_exceptions import QueryException

CATALOG = "RAW_CATALOG"
DATABASE = "RAW_DB"
TABLE = "RAW_TABLE"


class TestGlueTableQueryAndWrite:
    def setup_method(self):
        """Set up for test methods."""
        args = {"raw_database": DATABASE}
        self.glue = GlueTableQueryAndWrite(args)

    @mock_aws
    def test_does_glue_table_exist_true(self):
        glue_client = boto3.client("glue")
        glue_client.create_database(CatalogId=CATALOG, DatabaseInput={"Name": DATABASE})
        glue_client.create_table(DatabaseName=DATABASE, TableInput={"Name": TABLE})
        assert does_glue_table_exist(DATABASE, TABLE)

    @mock_aws
    def test_does_glue_table_exist_false(self):
        assert not does_glue_table_exist(DATABASE, TABLE)

    def test_does_glue_table_exist_unable_to_query(self):
        with pytest.raises(QueryException):
            does_glue_table_exist(DATABASE, TABLE)
