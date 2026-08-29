"""Logger module to configure logger."""

import logging
import os


def get_logger(name):
    """Check env variable and set LOG_LEVEL. If not found, set as INFO.

    Parameters:
        name(str): name of the logger

    Returns:
        Python standard logger
    """
    logger = logging.getLogger(name)
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, level, logging.INFO))
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(funcName)s:%(lineno)d - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

