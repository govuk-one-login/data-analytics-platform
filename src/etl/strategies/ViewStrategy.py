from Strategy import Strategy

from ..util.processing_utilities import extract_element_by_name


class ViewStrategy(Strategy):
    def extract(self):
        event_processing_view_criteria_view = extract_element_by_name(self.config_data, "view_name", "event_processing_view_criteria")

        if event_processing_view_criteria_view is None:
            raise ValueError("filter value for event_processing_view_criteria is not found within config rules")
        print(f"config rule: event_processing_view_criteria | view: {event_processing_view_criteria_view}")

        sql_query = self.generate_sql_query(event_processing_view_criteria_view)

        return self.get_raw_data(sql_query)

    def generate_sql_query(self, view):
        database = "raw_database"
        return f'select * from "{self.args[database]}"."{view}"'
