from __future__ import annotations

class RawToStageProcessor:
    
    def __init__(self, strategy) -> None:
        if strategy:
            self.strategy = strategy
            
    def process(self) -> None:
        
        # load data from raw layer
        dfs = self.strategy.load()
    
        # for each dfs, transform and then load
        for df in dfs:
            df_stage, df_key_values = self.strategy.transform(df)
            
            self.strategy.load(df_stage, df_key_values)
            
        
        
        
        
