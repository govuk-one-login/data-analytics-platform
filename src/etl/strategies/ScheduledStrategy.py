from Strategy import Strategy

from ..util.processing_utilities import extract_element_by_name


class ScheduledStrategy(Strategy):
    def extract(self):
        # get max timestamp
        max_processed_dt = 0

        # get max processed_dt
        max_timestamp = 0

        event_processing_selection_criteria_filter = extract_element_by_name(self.config_data, "filter", "event_processing_selection_criteria")

        if event_processing_selection_criteria_filter is None:
            raise ValueError("filter value for event_processing_selection_criteria is not found within config rules")
        print(f"config rule: event_processing_selection_criteria | filter: {event_processing_selection_criteria_filter}")

        event_processing_selection_criteria_limit = extract_element_by_name(self.config_data, "limit", "event_processing_selection_criteria")
        if event_processing_selection_criteria_limit is None:
            raise ValueError("limit value for event_processing_selection_criteria is not found within config rules")
        print(f"config rule: event_processing_selection_criteria | limit: {event_processing_selection_criteria_limit}")

        sql_query = self.generate_sql_query(
            event_processing_selection_criteria_limit,
            event_processing_selection_criteria_limit,
            max_processed_dt,
            max_timestamp,
        )

        return self.get_raw_data(sql_query)

    def generate_sql_query(self, filter, limit, filter_processed_dt, filter_timestamp):
        update_filter = filter.replace("processed_dt", str(filter_processed_dt - 1)).replace("replace_timestamp", str(filter_timestamp))
        sql = f"""select * from \"{self.args['raw_database']}\".\"{self.args['raw_source_table']}\" where {update_filter}"""

        if filter is not None and limit > 0:
            sql = sql + f" limit {limit}"
        return sql
