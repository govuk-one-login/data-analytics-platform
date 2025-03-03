from unittest.mock import MagicMock

import pandas as pd
from raw_to_stage_etl.processor.processor import RawToStageProcessor

data = {"Name": ["Alice", "Alice", "Charlie"], "Age": [25, 25, 28], "City": ["London", "London", "New York"]}
data2 = {"Name": ["Annabeth", "Percy", "Percy"], "Age": [16, 17, 17], "City": ["London", "Paris", "Paris"]}


class TestProcessor:
    def setup_method(self):
        df = pd.DataFrame(data)
        df2 = pd.DataFrame(data2)
        strategy = MagicMock()
        strategy.extract.return_value = [df, df2]
        strategy.transform.return_value = (df, df2, 1, 2, 2)
        self.process_instance = RawToStageProcessor(strategy)

    def test_should_run_process_successfully(self):
        (df_process_counter, cumulative_stage_table_rows_inserted, cumulative_stage_key_rows_inserted, cumulative_duplicate_rows_removed) = (
            self.process_instance.process()
        )
        assert (df_process_counter, cumulative_stage_table_rows_inserted, cumulative_stage_key_rows_inserted, cumulative_duplicate_rows_removed) == (2, 4, 4, 2)
