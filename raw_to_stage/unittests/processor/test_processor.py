from unittest.mock import MagicMock

from raw_to_stage_etl.processor.processor import RawToStageProcessor


class TestProcessor:
    def setup_method(self):
        strategy = MagicMock()
        self.process_instance = RawToStageProcessor(strategy)

    def test_should_run_process_successfully(self):
        self.process_instance.process()
