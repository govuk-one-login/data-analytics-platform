from ..util.processing_utilities import (get_all_processed_dts, get_all_processed_times_per_day,
                                         get_last_processed_time, get_max_processed_dt, get_max_timestamp,
                                         get_min_timestamp_from_previous_run, get_penultimate_processed_dt)
from .Strategy import Strategy


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


class BackfillStrategy(Strategy):
    def extract(self):
        current_process_time = None
        raw_database = self.args["raw_database"]
        raw_table = self.args["raw_source_table"]
        stage_database = self.args["stage_database"]
        stage_target_table = self.args["stage_target_table"]
        max_processed_dt = get_max_processed_dt(self.glue_client, raw_database, raw_table, stage_database, stage_target_table)
        if max_processed_dt is None:
            raise ValueError("Function 'get_max_processed_dt' returned None, which is not allowed.")
        self.logger.info("retrieved processed_dt filter value: %s", max_processed_dt)

        # if the process_dt is today, that means there are multiple processes today, we need this value to filter it out from the daily processes
        if max_processed_dt == self.preprocessing.processed_dt:
            current_process_time = self.preprocessing.processed_time

        all_previous_processed_times = get_all_processed_times_per_day(
            self.glue_client,
            self.args["stage_database"],
            self.args["stage_target_table"],
            max_processed_dt,
            current_process_time,
        )

        filter_processed_time = get_last_processed_time(all_previous_processed_times)
        if filter_processed_time is None:
            self.logger.info("no filter process time found, ending process")
            return

        all_previous_processed_dts = get_all_processed_dts(
            self.glue_client,
            self.args["stage_database"],
            self.args["stage_target_table"],
            max_processed_dt,
            self.preprocessing.processed_dt,
        )

        penultimate_processed_dt = get_penultimate_processed_dt(all_previous_processed_dts)
        if penultimate_processed_dt is None:
            self.logger.info("no penultimate processed dt, ending process")
            return

        min_timestamp_filter_for_missing_events = get_min_timestamp_from_previous_run(
            all_previous_processed_times,
            self.glue_client,
            self.args["stage_database"],
            self.args["stage_target_table"],
            max_processed_dt,
            penultimate_processed_dt,
        )

        if min_timestamp_filter_for_missing_events is None:
            self.logger.info("Could not calculate a minimum timestamp to filter for missing events, ending process")
            return

        max_timestamp = get_max_timestamp(self.glue_client, stage_database, stage_target_table)

        if max_timestamp is None:
            raise ValueError("Function 'get_max_timestamp' returned None, which is not allowed.")
        self.logger.info("retrieved timestamp filter value: %s", max_timestamp)

        backfill_raw_sql = get_raw_sql(
            raw_database,
            raw_table,
            stage_database,
            stage_target_table,
            min_timestamp_filter_for_missing_events,
            max_timestamp,
            max_processed_dt,
            filter_processed_time,
            penultimate_processed_dt,
        )
        # query raw layer
        return self.get_raw_data(backfill_raw_sql)
