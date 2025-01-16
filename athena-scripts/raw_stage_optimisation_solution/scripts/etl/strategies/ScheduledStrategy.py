from ..old.core_preprocessing_functions import get_max_processed_dt, get_max_timestamp
from ..util.processing_utilities import extract_element_by_name
from .Strategy import Strategy


class ScheduledStrategy(Strategy):
    def extract(self):
        raw_database = self.args["raw_database"]
        raw_table = self.args["raw_source_table"]
        stage_database = self.args["stage_database"]
        stage_target_table = self.args["stage_target_table"]
        max_processed_dt = get_max_processed_dt(self.glue_client, raw_database, raw_table, stage_database, stage_target_table)
        if max_processed_dt is None:
            raise ValueError("Function 'get_max_processed_dt' returned None, which is not allowed.")
        print(f"retrieved processed_dt filter value: {max_processed_dt}")

        max_timestamp = get_max_timestamp(self.glue_client, stage_database, stage_target_table)

        if max_timestamp is None:
            raise ValueError("Function 'get_max_timestamp' returned None, which is not allowed.")
        print(f"retrieved timestamp filter value: {max_timestamp}")

        sql_query = self.get_raw_sql(max_processed_dt, max_timestamp, raw_database, raw_table)
        return self.get_raw_data(sql_query)

    def get_raw_sql(self, max_processed_dt, max_timestamp, raw_database, raw_table):
        event_processing_selection_criteria_filter = extract_element_by_name(self.config_data, "filter", "event_processing_selection_criteria")
        if event_processing_selection_criteria_filter is None:
            raise ValueError("filter value for event_processing_selection_criteria is not found within config rules")
        print(f"config rule: event_processing_selection_criteria | filter: {event_processing_selection_criteria_filter}")
        event_processing_selection_criteria_limit = extract_element_by_name(self.config_data, "limit", "event_processing_selection_criteria")
        if event_processing_selection_criteria_limit is None:
            raise ValueError("limit value for event_processing_selection_criteria is not found within config rules")
        print(f"config rule: event_processing_selection_criteria | limit: {event_processing_selection_criteria_limit}")
        update_filter = event_processing_selection_criteria_filter.replace("processed_dt", str(max_processed_dt - 1)).replace(
            "replace_timestamp", str(max_timestamp)
        )
        sql_query = f"""select * from \"{raw_database}\".\"{raw_table}\" where {update_filter}"""
        if event_processing_selection_criteria_limit is not None and event_processing_selection_criteria_limit > 0:
            sql_query = sql_query + f" limit {event_processing_selection_criteria_limit}"
        return sql_query

    def generate_sql_query(self, custom_filter):
        deduplicate_subquery = f"""select *,
                                row_number() over (
                                        partition by event_id
                                        order by cast(
                                    concat(
                                        cast(year as varchar),
                                        cast(lpad(cast(month as varchar), 2, '0') as varchar),
                                        cast(lpad(cast(day as varchar), 2, '0') as varchar)
                                    ) as int
                                ) desc
                                        ) as row_num
                        from \"{self.args['raw_database']}\".\"{self.args['raw_source_table']}\" as t
                    where {custom_filter}"""
        return f"select * from ({deduplicate_subquery}) where row_num = 1"
