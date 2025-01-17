import logging
import os

# Fetch and set from environment variables
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")


# Fetch and set from dict (For setting glue job parameters)
def init(args):
    if args is not None:
        global LOG_LEVEL
        LOG_LEVEL = args.get("LOG_LEVEL")


def configure(logger):
    formatter = logging.Formatter("%(levelname)s [%(filename)s->%(funcName)s():%(lineno)s]: %(message)s")
    logger.setLevel(LOG_LEVEL)
    logger.propagate = False
    if not logger.handlers:
        sh = logging.StreamHandler()
        sh.setFormatter(formatter)
        logger.addHandler(sh)


def set_log_level(logger):
    configure(logger)
