"""ScheduledStrategy is for ETL which runs everyday on schedule."""

from ..util.database_utilities import (date_minus_days, get_max_processed_dt, get_max_timestamp,
                                       timestamp_minus_firehose_buffer_time)
from ..util.json_config_processing_utilities import extract_element_by_name
from .strategy import Strategy


class ScheduledStrategy(Strategy):
    """This class extends Strategy and overrides extract method.Also creates & executes raw sql query and returns df."""

    def __init__(self, args, config_data, glue_client, s3_client, preprocessing, max_timestamp=None, max_processed_dt=None):
        """Initialise super class constructor and set other variables."""
        super().__init__(args, config_data, glue_client, s3_client, preprocessing)
        self.max_timestamp = max_timestamp
        self.max_processed_dt = max_processed_dt

    def extract(self):
        """Extract data by getting raw sql query and executing on Athena.

        Returns pandas dataframe.
        """
        raw_database = self.args["raw_database"]
        raw_table = self.args["raw_source_table"]
        stage_database = self.args["stage_database"]
        stage_target_table = self.args["stage_target_table"]
        self.max_processed_dt = get_max_processed_dt(self.glue_client, raw_database, raw_table, stage_database, stage_target_table)
        if self.max_processed_dt is None:
            raise ValueError("Function 'get_max_processed_dt' returned None, which is not allowed.")
        self.logger.info("retrieved processed_dt filter value: %s", self.max_processed_dt)

        self.max_timestamp = get_max_timestamp(self.glue_client, stage_database, stage_target_table)

        if self.max_timestamp is None:
            raise ValueError("Function 'get_max_timestamp' returned None, which is not allowed.")
        self.logger.info("retrieved timestamp filter value is: %s", self.max_timestamp)

        """Firehose buffer time is 15 mins.So we subtract 20 mins from the max timestamp which ensures every run will
           look for events with a timestamp higher than that value. This is to catch any events which might have flown
           in during previous run(As soon as ETL job extracts data, if records flow in after that extract cut off, they
           will be missed without this subtraction) and might have been missed. This will result in duplicates in the
           stage layer which the conformed layer will be able to handle"""
        firehose_adjusted_max_timestamp = str(timestamp_minus_firehose_buffer_time(self.max_timestamp, minutes=20))

        sql_query = self.get_raw_sql(self.max_processed_dt, firehose_adjusted_max_timestamp, raw_database, raw_table)
        return self.glue_client.get_raw_data(sql_query, self.athena_query_chunksize)

    def get_raw_sql(self, max_processed_dt, max_timestamp, raw_database, raw_table):
        """Prepare sql query based on config data and filters passed.

        Parameters:
         max_processed_dt (date as int): The max processed date filter to skip records before this date.
         max_timestamp (date as int): The max timestamp filter to skip records before this time.
         raw_database (str): The name of the raw database to read from.
         raw_table (str): The name of the raw table to read from.

        Returns:
         str: The raw sql query to be used to extract data.
        """
        event_processing_selection_criteria_filter = extract_element_by_name(self.config_data, "filter", "event_processing_selection_criteria")
        if event_processing_selection_criteria_filter is None:
            raise ValueError("filter value for event_processing_selection_criteria is not found within config rules")
        self.logger.info("config rule: event_processing_selection_criteria | filter: %s", event_processing_selection_criteria_filter)
        event_processing_selection_criteria_limit = extract_element_by_name(self.config_data, "limit", "event_processing_selection_criteria")
        if event_processing_selection_criteria_limit is None:
            raise ValueError("limit value for event_processing_selection_criteria is not found within config rules")
        self.logger.info("config rule: event_processing_selection_criteria | limit: %s", event_processing_selection_criteria_limit)
        update_filter = event_processing_selection_criteria_filter.replace("processed_dt", date_minus_days(max_processed_dt, 1)).replace(
            "replace_timestamp", str(max_timestamp)
        )
        sql_query = f"""select * from \"{raw_database}\".\"{raw_table}\" where {update_filter}"""
        if event_processing_selection_criteria_limit is not None and event_processing_selection_criteria_limit > 0:
            sql_query = sql_query + f" limit {event_processing_selection_criteria_limit}"
        return sql_query
