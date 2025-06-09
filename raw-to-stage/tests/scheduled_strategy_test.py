import unittest
from raw_to_stage_etl.strategies.scheduled_strategy import date_minus_days


class ScheduledStrategyTestCase(unittest.TestCase):
    def test_date_minus_days(self):
        date = "20250609"
        self.assertEqual(date_minus_days(date, 10),"20250530")

if __name__ == '__main__':
    unittest.main()
