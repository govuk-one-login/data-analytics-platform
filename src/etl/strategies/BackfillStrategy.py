from Strategy import Strategy
from processing_utilities import extract_element_by_name


class BackfillStrategy(Strategy):

    def extract(self):
        
        # get max timestamp
        max_processed_dt = 0
        
        # get max processed_dt
        max_timestamp= 0
        
        # get min timestamp
        min_timestamp = 0
        
        # get processed_time
        processed_time = 0
        event_processing_selection_criteria_filter = extract_element_by_name(self.config_data, "filter", "event_processing_selection_criteria")
        
        if event_processing_selection_criteria_filter is None:
            raise ValueError("filter value for event_processing_selection_criteria is not found within config rules")
        print(f'config rule: event_processing_selection_criteria | filter: {event_processing_selection_criteria_filter}')
        
        event_processing_selection_criteria_limit = extract_element_by_name(self.config_data, "limit", "event_processing_selection_criteria")
        if event_processing_selection_criteria_limit is None:
            raise ValueError("limit value for event_processing_selection_criteria is not found within config rules")
        print(f'config rule: event_processing_selection_criteria | limit: {event_processing_selection_criteria_limit}')
        
        sql_query = self.generate_sql_query(event_processing_selection_criteria_limit, 
                                            event_processing_selection_criteria_limit,
                                            max_processed_dt,
                                            max_timestamp)
        
        return self.get_raw_data(sql_query)
        
    def generate_sql_query(self, min_timestamp, max_timestamp, processed_time, processed_dt):
        penultimate_processed_dt = 0
        
        return f'''
                SELECT *
                FROM \"{self.args['raw_database']}\".\"{self.args['raw_source_table']}\"
                WHERE event_id IN (
		            SELECT raw.event_id
		            FROM \\"{self.args['raw_database']}\".\"{self.args['raw_source_table']}\" raw
			        LEFT OUTER JOIN \"{self.args['stage_database']}\".\"{self.args['stage_target_table']}\" sl ON raw.event_id = sl.event_id
                    AND sl.processed_dt = {processed_dt}
                    AND sl.processed_time = {processed_time}
		            WHERE sl.event_id is null
			        AND CAST(concat(raw.year, raw.month, raw.day) AS INT) >= {penultimate_processed_dt} - 1
			        AND CAST(raw.timestamp as int) > {min_timestamp}
			        AND CAST(raw.timestamp as int) <= {max_timestamp}
	            )
	            AND CAST(concat(year, month, day) AS INT) >= {penultimate_processed_dt} - 1
             '''
