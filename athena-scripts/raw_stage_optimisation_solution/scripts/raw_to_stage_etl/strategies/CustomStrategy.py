"""CustomStrategy is for ETL which can be run when required."""

from ..util.processing_utilities import extract_element_by_name
from .Strategy import Strategy


class CustomStrategy(Strategy):
    """This class extends Strategy and overrides extract method.Also creates & executes raw sql query and returns df."""

    def extract(self):
        """Extract data by getting raw sql query and executing on Athena.

        Returns pandas dataframe.
        """
        event_processing_custom_filter = extract_element_by_name(self.config_data, "filter", "event_processing_testing_criteria")

        if event_processing_custom_filter is None:
            raise ValueError("filter value for event_processing_custom_filter is not found within config rules")
        self.logger.info("config rule: event_processing_view_criteria | view: %s", event_processing_custom_filter)

        sql_query = self.generate_sql_query(event_processing_custom_filter)

        return self.get_raw_data(sql_query)

    def generate_sql_query(self, custom_filter):
        """Prepare sql query based on filters passed. Deduplicates and takes latest record for each event_id.

        Parameters:
         custom_filter (str): The max processed date filter to skip records before this date.

        Returns:
         str: The raw sql query to be used to extract data.
        """
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
