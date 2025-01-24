"""Logging module."""

import logging
import os

# Fetch and set from environment variables
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")


def init(args):
    """Fetch and set from dict (For setting log level from glue job parameters).

    Parameters:
     args(dict): glue job arguments

    Returns:
     None
    """
    if args is not None:
        global LOG_LEVEL
        LOG_LEVEL = args.get("LOG_LEVEL")


def configure(logger):
    """Configure logger behavior.

    Parameters:
     logger

    Returns
     None
    """
    formatter = logging.Formatter("%(levelname)s [%(filename)s->%(funcName)s():%(lineno)s]: %(message)s")
    logger.setLevel(LOG_LEVEL)
    logger.propagate = False
    if not logger.handlers:
        sh = logging.StreamHandler()
        sh.setFormatter(formatter)
        logger.addHandler(sh)


def set_log_level(logger):
    """Configure logger."""
    configure(logger)
