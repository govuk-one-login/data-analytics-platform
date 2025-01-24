"""Module for all Util Exceptions."""


class OperationFailedException(Exception):
    """Custom exception class for representing failed operations on Dataframe."""


class QueryException(Exception):
    """Custom exception class for representing errors querying table in Database."""


class JSONReadException(Exception):
    """Custom exception class for representing JSON config read failures."""
