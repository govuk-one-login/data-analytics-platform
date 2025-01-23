"""BackfillStrategy is run after ScheduledStrategy to pick up records not picked up by ScheduledStrategy."""

from raw_to_stage_etl.strategies.ScheduledStrategy import ScheduledStrategy
from raw_to_stage_etl.util.exceptions.UtilExceptions import OperationFailedException

from ..util.processing_utilities import (get_all_processed_dts, get_all_processed_times_per_day,
                                         get_last_processed_time, get_min_timestamp_from_previous_run,
                                         get_penultimate_processed_dt)


def get_raw_sql(
    raw_database,
    raw_table,
    stage_layer_database,
    stage_layer_target_table,
    filter_min_timestamp,
    filter_max_timestamp,
    filter_processed_dt,
    filter_processed_time,
    penultimate_processed_dt,
):
    """Prepare sql query based on args and filters passed.

    Parameters
     raw_database (str): The name of the raw database to read from.
     raw_table (str): The name of the raw table to read from.
     stage_layer_database (str): The stage layer database
     stage_layer_target_table (str): The stage table to write data to
     filter_min_timestamp (date as int): The data should be greater than this timestamp
     filter_max_timestamp (date as int): The data should be less than this timestamp
     filter_processed_dt (date as int): The date till which data has been processed already
     filter_processed_time (date as int): The time till which data has been processed already
     penultimate_processed_dt (date as int): The date on which data was processed before current processed date

    Returns
     str: SQL Query string
    """
    return f"""
        SELECT *
        FROM \"{raw_database}\".\"{raw_table}\"
        WHERE event_id IN (
                        SELECT raw.event_id
                        FROM \"{raw_database}\".\"{raw_table}\" raw
                            LEFT OUTER JOIN \"{stage_layer_database}\".\"{stage_layer_target_table}\" sl ON raw.event_id = sl.event_id
                AND sl.processed_dt = {filter_processed_dt}
                AND sl.processed_time = {filter_processed_time}
                        WHERE sl.event_id is null
                            AND CAST(concat(raw.year, raw.month, raw.day) AS INT) >= {penultimate_processed_dt} - 1
                            AND CAST(raw.timestamp as int) > {filter_min_timestamp}
                            AND CAST(raw.timestamp as int) <= {filter_max_timestamp}
            )
            AND CAST(concat(year, month, day) AS INT) >= {penultimate_processed_dt} - 1"""


class BackfillStrategy(ScheduledStrategy):
    def __init__(self, args, config_data, glue_client, s3_client, preprocessing, max_timestamp, max_processed_dt):
        super().__init__(args, config_data, glue_client, s3_client, preprocessing, max_timestamp, max_processed_dt)

    def extract(self):
        current_process_time = None
        raw_database = self.args["raw_database"]
        raw_table = self.args["raw_source_table"]
        stage_database = self.args["stage_database"]
        stage_target_table = self.args["stage_target_table"]
        self.logger.info("retrieved processed_dt filter value from Scheduled Strategy: %s", self.max_processed_dt)

        # if the process_dt is today, that means there are multiple processes today, we need this value to filter it out from the daily processes
        if self.max_processed_dt == self.preprocessing.processed_dt:
            current_process_time = self.preprocessing.processed_time

        all_previous_processed_times = get_all_processed_times_per_day(
            self.glue_client,
            self.args["stage_database"],
            self.args["stage_target_table"],
            self.max_processed_dt,
            current_process_time,
        )

        filter_processed_time = get_last_processed_time(all_previous_processed_times)

        all_previous_processed_dts = get_all_processed_dts(
            self.glue_client,
            self.args["stage_database"],
            self.args["stage_target_table"],
            self.max_processed_dt,
            self.preprocessing.processed_dt,
        )

        penultimate_processed_dt = get_penultimate_processed_dt(all_previous_processed_dts)

        min_timestamp_filter_for_missing_events = get_min_timestamp_from_previous_run(
            all_previous_processed_times,
            self.glue_client,
            self.args["stage_database"],
            self.args["stage_target_table"],
            self.max_processed_dt,
            penultimate_processed_dt,
        )

        if min_timestamp_filter_for_missing_events is None:
            raise OperationFailedException("Could not calculate a minimum timestamp to filter for missing events, ending process")

        self.logger.info("retrieved timestamp filter value: %s", self.max_timestamp)

        backfill_raw_sql = get_raw_sql(
            raw_database,
            raw_table,
            stage_database,
            stage_target_table,
            min_timestamp_filter_for_missing_events,
            self.max_timestamp,
            self.max_processed_dt,
            filter_processed_time,
            penultimate_processed_dt,
        )
        # query raw layer
        return self.get_raw_data(backfill_raw_sql)
