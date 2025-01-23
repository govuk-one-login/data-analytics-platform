"""Module for all Util Exceptions."""


class OperationFailedException(Exception):
    """Custom exception class for representing failed operations on Dataframe."""


class TableQueryException(Exception):
    """Custom exception class for representing errors querying table in Database."""
