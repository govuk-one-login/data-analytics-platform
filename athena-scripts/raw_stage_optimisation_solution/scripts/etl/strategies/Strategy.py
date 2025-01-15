class Strategy:
    def __init__(self, args, config_data, glue_client, s3_client, preprocessing) -> None:
        self.args = args
        self.config_data = config_data
        self.glue_client = glue_client
        self.s3_client = s3_client
        self.preprocessing = preprocessing
        self.athena_query_chunksize = 1000000

    def extract(self):
        pass

    def transform(self, df):
        pass

    def load(self, df_main_stage, df_key_values):
        pass

    def get_raw_data(self, sql_query):
        print(f"running query {sql_query}")

        dfs = self.glue_client.query_glue_table(self.args["raw_database"], sql_query, self.athena_query_chunksize)
        if dfs is None:
            raise ValueError(f"Function: query_glue_table returned None.  Using query {str(sql_query)}")

        return dfs
