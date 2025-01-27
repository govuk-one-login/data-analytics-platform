"""Module for JSON Config processing related utilities."""

import json

from aws_lambda_powertools import Logger

from .exceptions.UtilExceptions import JSONReadException

INVALID_JSON_ERROR = "Invalid JSON data provided"

logger = Logger(level="INFO")


def generate_raw_select_filter(json_data, database, table, filter_processed_dt, filter_timestamp):
    """
    Generate a SQL select criteria for the raw data-set based on JSON configuration.

    Parameters:
    json_data (dict or list): The JSON configuration data.
    database (str): The name of the database.
    table (str): The name of the table.
    filter_processed_dt (int): The processed_dt value for filtering.
    filter_timestamp (int): the timestamp for filtering

    Returns:
    str: The SQL select criteria for the raw data-set.
    """
    try:
        if not isinstance(json_data, (dict, list)):
            raise ValueError(INVALID_JSON_ERROR)

        (
            event_processing_selection_criteria_filter,
            event_processing_selection_criteria_limit,
            event_processing_testing_criteria_enabled,
            event_processing_testing_criteria_filter,
            event_processing_view_criteria_enabled,
            event_processing_view_criteria_view,
        ) = extract_and_validate_filters(json_data)

        deduplicate_subquery = f"""select *,
                                    row_number() over (
                                            partition by event_id
                                            order by cast(
                                        concat(
                                            cast(year as varchar),
                                            cast(lpad(cast(month as varchar), 2, '0') as varchar),
                                            cast(lpad(cast(day as varchar), 2, '0') as varchar)
                                        ) as int
                                    ) desc
                                        ) as row_num
                            from \"{database}\".\"{table}\" as t """

        sql = f'''select * from \"{database}\".\"{table}\"'''

        if event_processing_view_criteria_enabled and event_processing_view_criteria_view is not None:
            sql = f'select * from "{database}"."{event_processing_view_criteria_view}"'
        elif event_processing_testing_criteria_enabled and event_processing_testing_criteria_filter is not None:
            deduplicate_subquery = deduplicate_subquery + f" where {event_processing_testing_criteria_filter}"
            sql = f"select * from ({deduplicate_subquery}) where row_num = 1"
        elif event_processing_selection_criteria_filter is not None:
            update_filter = event_processing_selection_criteria_filter.replace("processed_dt", str(filter_processed_dt - 1)).replace(
                "replace_timestamp", str(filter_timestamp)
            )

            sql = sql + f" where {update_filter}"

            if event_processing_selection_criteria_limit is not None and event_processing_selection_criteria_limit > 0:
                sql = sql + f" limit {event_processing_selection_criteria_limit}"

        return sql

    except Exception as e:
        raise JSONReadException(f"Exception Error retrieving config rule value: {str(e)}")


def extract_and_validate_filters(json_data):
    """Extract and validate filters from json config.

    Parameters:
     json_data (dict or list): The JSON data structure to search.

    Returns:
     filters and flags(enabled/disabled for each filter)
    """
    event_processing_selection_criteria_filter = extract_element_by_name(json_data, "filter", "event_processing_selection_criteria")
    if event_processing_selection_criteria_filter is None:
        raise ValueError("filter value for event_processing_selection_criteria is not found within config rules")
    logger.info(f"config rule: event_processing_selection_criteria | filter: {event_processing_selection_criteria_filter}")
    event_processing_selection_criteria_limit = extract_element_by_name(json_data, "limit", "event_processing_selection_criteria")
    if event_processing_selection_criteria_limit is None:
        raise ValueError("limit value for event_processing_selection_criteria is not found within config rules")
    logger.info(f"config rule: event_processing_selection_criteria | limit: {event_processing_selection_criteria_limit}")
    event_processing_testing_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_testing_criteria")
    if event_processing_selection_criteria_limit is None:
        raise ValueError("enabled value for event_processing_testing_criteria is not found within config rules")
    logger.info(f"config rule: event_processing_testing_criteria | enabled: {event_processing_testing_criteria_enabled}")
    event_processing_testing_criteria_filter = extract_element_by_name(json_data, "filter", "event_processing_testing_criteria")
    if event_processing_selection_criteria_limit is None:
        raise ValueError("filter value for event_processing_testing_criteria is not found within config rules")
    logger.info(f"config rule: event_processing_testing_criteria | filter: {event_processing_testing_criteria_filter}")
    event_processing_view_criteria_enabled = extract_element_by_name(json_data, "enabled", "event_processing_view_criteria")
    if event_processing_view_criteria_enabled is None:
        raise ValueError("enabled value for event_processing_view_criteria is not found within config rules")
    logger.info(f"config rule: event_processing_view_criteria | enabled: {event_processing_view_criteria_enabled}")
    event_processing_view_criteria_view = extract_element_by_name(json_data, "view_name", "event_processing_view_criteria")
    if event_processing_view_criteria_view is None:
        raise ValueError("filter value for event_processing_view_criteria is not found within config rules")
    logger.info(f"config rule: event_processing_view_criteria | view: {event_processing_view_criteria_view}")
    return (
        event_processing_selection_criteria_filter,
        event_processing_selection_criteria_limit,
        event_processing_testing_criteria_enabled,
        event_processing_testing_criteria_filter,
        event_processing_view_criteria_enabled,
        event_processing_view_criteria_view,
    )


def extract_element_by_name(json_data, element_name, parent_name=None):
    """
    Extract an element from a JSON data structure by name, optionally matching a parent name.

    Parameters:
    json_data (dict or list): The JSON data structure to search.
    element_name (str): The name of the element to extract.
    parent_name (str, optional): The name of the parent element to match, if applicable.

    Returns:
    Any: The extracted element, or None if not found.
    """
    try:
        if not isinstance(json_data, (dict, list)):
            raise ValueError(INVALID_JSON_ERROR)

        if isinstance(json_data, dict):
            if parent_name is None:
                if element_name in json_data:
                    return json_data[element_name]
            elif parent_name in json_data and element_name in json_data[parent_name]:
                return json_data[parent_name][element_name]

            for _key, value in json_data.items():
                if isinstance(value, (dict, list)):
                    result = extract_element_by_name(value, element_name, parent_name)
                    if result is not None:
                        return result
        elif isinstance(json_data, list):
            for item in json_data:
                if isinstance(item, (dict, list)):
                    result = extract_element_by_name(item, element_name, parent_name)
                    if result is not None:
                        return result

        return None

    except Exception as e:
        raise JSONReadException(f"Exception Error retrieving config rule value: {str(e)}")


def extract_element_by_name_and_validate(json_data, element_name, parent_name):
    """Extract, validate element and return value.

    Parameters:
    json_data(dict): JSON Config data
    element_name(str): Element name
    parent_name(str): Parent name of Element

    Returns:
     Extracted value
    """
    extracted = extract_element_by_name(json_data, element_name, parent_name)
    if extracted is None:
        raise ValueError(f"{element_name} value for {parent_name} is not found within config rules")
    if isinstance(extracted, list):
        logger.info("stage layer %s partition column: %s", parent_name, extracted)
    else:
        logger.info("stage layer %s:\n%s", parent_name, json.dumps(extracted, indent=4))
    return extracted
