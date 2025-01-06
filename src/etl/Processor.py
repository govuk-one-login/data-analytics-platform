from __future__ import annotations

from strategies.Strategy import Strategy


class RawToStageProcessor:
    def __init__(self, strategy: Strategy) -> None:
        if strategy:
            self.strategy = strategy

    def process(self) -> None:
        # extract data from raw layer
        dfs = self.strategy.extract()

        # for each dataframe, transform and then load
        for df in dfs:
            df_stage, df_key_values = self.strategy.transform(df)

            self.strategy.load(df_stage, df_key_values)
