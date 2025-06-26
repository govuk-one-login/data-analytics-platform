import pytest
from unittest import mock
from raw_to_stage_etl.clients.glue_table_query_and_write import GlueTableQueryAndWrite

@pytest.fixture
def mock_logger():
    with mock.patch("raw_to_stage_etl.clients.glue_table_query_and_write.get_logger") as logger_mock:
        yield logger_mock

@pytest.fixture
def glue_client(mock_logger):
    args = {"raw_database": "test_db"}
    return GlueTableQueryAndWrite(args)

@mock.patch("raw_to_stage_etl.clients.glue_table_query_and_write.wr.catalog.does_table_exist")
def test_does_glue_table_exist_true(mock_does_exist, glue_client):
    mock_does_exist.return_value = True
    assert glue_client.does_glue_table_exist("db", "tbl") is True
    mock_does_exist.assert_called_once_with(database="db", table="tbl")

@mock.patch("raw_to_stage_etl.clients.glue_table_query_and_write.wr.catalog.does_table_exist")
def test_does_glue_table_exist_false(mock_does_exist, glue_client):
    mock_does_exist.return_value = False
    assert glue_client.does_glue_table_exist("db", "tbl") is False

@mock.patch("raw_to_stage_etl.clients.glue_table_query_and_write.wr.catalog.does_table_exist")
def test_does_glue_table_exist_exception(mock_does_exist, glue_client):
    mock_does_exist.side_effect = Exception("fail")
    assert glue_client.does_glue_table_exist("db", "tbl") is None

@mock.patch("raw_to_stage_etl.clients.glue_table_query_and_write.wr.athena.read_sql_query")
def test_query_glue_table_success(mock_read_sql, glue_client):
    mock_df = mock.Mock()
    mock_read_sql.return_value = mock_df
    result = glue_client.query_glue_table("db", "SELECT * FROM tbl", chunksize=5)
    assert result == mock_df
    mock_read_sql.assert_called_once_with("SELECT * FROM tbl", database="db", chunksize=5)

@mock.patch("raw_to_stage_etl.clients.glue_table_query_and_write.wr.athena.read_sql_query")
def test_query_glue_table_exception(mock_read_sql, glue_client):
    mock_read_sql.side_effect = Exception("fail")
    result = glue_client.query_glue_table("db", "SELECT * FROM tbl")
    assert result is None

@mock.patch("raw_to_stage_etl.clients.glue_table_query_and_write.wr.s3.to_parquet")
def test_write_to_glue_table_success(mock_to_parquet, glue_client):
    mock_to_parquet.return_value = {"some": "meta"}
    df = mock.Mock()
    result = glue_client.write_to_glue_table(
        dataframe=df,
        s3_path="s3://bucket/path",
        dataset=True,
        database="db",
        insert_mode="overwrite",
        table="tbl",
        dtype={"col": "string"},
        partition_cols=["col"]
    )
    assert result == {"some": "meta"}
    mock_to_parquet.assert_called_once()

@mock.patch("raw_to_stage_etl.clients.glue_table_query_and_write.wr.s3.to_parquet")
def test_write_to_glue_table_exception(mock_to_parquet, glue_client):
    mock_to_parquet.side_effect = Exception("fail")
    df = mock.Mock()
    result = glue_client.write_to_glue_table(
        dataframe=df,
        s3_path="s3://bucket/path",
        dataset=True,
        database="db",
        insert_mode="overwrite",
        table="tbl",
        dtype={"col": "string"},
        partition_cols=["col"]
    )
    assert result is None

def test_get_raw_data_success(glue_client):
    with mock.patch.object(glue_client, "query_glue_table", return_value=["df1", "df2"]) as mock_query:
        glue_client.args["raw_database"] = "db"
        result = glue_client.get_raw_data("SELECT * FROM tbl", 10)
        assert result == ["df1", "df2"]
        mock_query.assert_called_once_with("db", "SELECT * FROM tbl", 10)

def test_get_raw_data_none_raises(glue_client):
    with mock.patch.object(glue_client, "query_glue_table", return_value=None):
        glue_client.args["raw_database"] = "db"
        with pytest.raises(ValueError, match="Function: query_glue_table returned None"):
            glue_client.get_raw_data("SELECT * FROM tbl", 10)
