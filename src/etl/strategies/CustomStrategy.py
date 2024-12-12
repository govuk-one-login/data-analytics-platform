from Strategy import Strategy
from processing_utilities import extract_element_by_name


class CustomStrategy(Strategy):
    
    def extract(self):
        event_processing_custom_filter = extract_element_by_name(self.config_data, "filter", "event_processing_testing_criteria")
        
        if event_processing_custom_filter is None:
            raise ValueError("filter value for event_processing_custom_filter is not found within config rules")
        print(f'config rule: event_processing_view_criteria | view: {event_processing_custom_filter}')
        
        sql_query = self.generate_sql_query(event_processing_custom_filter)
        
        return self.get_raw_data(sql_query)
        
    def generate_sql_query(self, custom_filter):
        
        deduplicate_subquery = f'''select *,
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
                    where {custom_filter}'''
        return f'select * from ({deduplicate_subquery}) where row_num = 1'

