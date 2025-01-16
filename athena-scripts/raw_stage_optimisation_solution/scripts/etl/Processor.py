from __future__ import annotations

import time

from .strategies.Strategy import Strategy

METADATA_ROOT_FOLDER = "txma_raw_stage_metadata"


class RawToStageProcessor:

    def __init__(self, strategy: Strategy) -> None:
        if strategy:
            self.strategy = strategy

    def process(self) -> None:

        # extract data from raw layer
        dfs = self.strategy.extract()

        df_process_counter = 0
        cumulative_stage_table_rows_inserted = 0
        cumulative_stage_key_rows_inserted = 0
        cumulative_duplicate_rows_removed = 0

        # for each dataframe, transform and then load
        for df_raw in dfs:
            df_process_counter += 1
            print(f"processing dataframe chunk: {df_process_counter}")
            # Record the start time
            start_time = time.time()

            # Transform df chunk
            (df_stage, df_key_values, duplicate_rows_removed, stage_table_rows_inserted, stage_key_rows_inserted) = self.strategy.transform(df_raw)

            cumulative_duplicate_rows_removed = cumulative_duplicate_rows_removed + duplicate_rows_removed
            cumulative_stage_table_rows_inserted = cumulative_stage_table_rows_inserted + stage_table_rows_inserted
            cumulative_stage_key_rows_inserted = cumulative_stage_key_rows_inserted + stage_key_rows_inserted

            # Load transformed dfs
            self.strategy.load(df_stage, df_key_values)

            # Record the end time
            end_time = time.time()

            # Calculate the elapsed time in seconds
            elapsed_time = end_time - start_time

            # Convert the elapsed time to minutes
            elapsed_minutes = elapsed_time / 60

            # Print the result
            print(f"Time taken to process dataframe {df_process_counter}: {elapsed_minutes:.2f} minutes")
            print("stage layer successfully updated")
            print(f"total stage table records inserted: {cumulative_stage_table_rows_inserted}")
            print(f"total stage key table records inserted: {cumulative_stage_key_rows_inserted}")
            print(f"total duplicate rows removed: {cumulative_duplicate_rows_removed}")
