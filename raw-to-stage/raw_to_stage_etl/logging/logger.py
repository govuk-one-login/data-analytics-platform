"""Logger module to configure logger."""

import os

from aws_lambda_powertools import Logger


def get_logger(name):
    """Check env variable and set LOG_LEVEL. If not found, set as INFO.

    Parameters:
        name(str): name of the logger

    Returns:
        AWS powertools Logger
    """
    logger = Logger(level=os.getenv("LOG_LEVEL", "INFO"), service=name)
    logger.append_keys(**{"location": "%(filename)s:%(funcName)s:%(lineno)d"})
    return logger

