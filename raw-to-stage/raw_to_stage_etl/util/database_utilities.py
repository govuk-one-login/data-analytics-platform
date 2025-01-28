"""Module for database querying related utilities utilizing glue client."""

from datetime import datetime, timedelta

from ..logging.logger import get_logger
from .exceptions.UtilExceptions import QueryException

logger = get_logger(__name__)


def get_all_previous_processed_dts(glue_client, stage_database, stage_target_table, max_processed_dt, current_process_dt):
    """Get all previous processed dates(excluding max processed date and current processing date).

    Parameters:
     glue_client
     stage_database
     stage_target_table
     max_processed_dt
     current_process_dt

    Returns
     Pandas dataframe with processed dates
    """
    try:
        if glue_client.does_glue_table_exist(stage_database, stage_target_table):
            sql = f"""select distinct processed_dt as processed_dt
                    from \"{stage_database}\".\"{stage_target_table}$partitions\"
                    where processed_dt not in {max_processed_dt, current_process_dt}
                 """

            sql += """ order by processed_dt desc"""

            logger.info(f"Running query: {sql}")
            dfs = glue_client.query_glue_table(stage_database, sql, 10)

            if dfs is None:
                raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")

            for df in dfs:
                if "processed_dt" in df.columns:
                    return df
    except Exception as e:
        raise QueryException(f"Exception Error retrieving daily processes {str(e)}")


def get_min_timestamp_from_previous_run(daily_processes_df, glue_client, stage_database, stage_target_table, max_processed_dt, penultimate_processed_dt):
    """Get the minimum timestamp to filter for any missing events.

    This value is taken from the maximum timestamp from the job previous to the last job

    Parameters:
    glue_client (object): An object representing the Glue class.
    raw_database (str): The name of the database containing the raw table.
    raw_source_table (str): The name of the source table in the raw database.
    stage_target_table (str): The name of the target table in the stage database.
    stage_database (str): The name of the database containing the stage_target_table.
    stage_table_exists (bool): True if stage table exists

    Returns:
    int: The maximum timestamp value from the stagetable
    """
    try:
        if daily_processes_df.empty or len(daily_processes_df.index) <= 1:
            # If there are <= 1 processes for a given day, then we need to get the latest timestamp processed from the previous processed day
            max_timestamp = get_max_timestamp(glue_client, stage_database, stage_target_table, penultimate_processed_dt)

            logger.info(f"""Retrieved timestamp:{max_timestamp} from date:{penultimate_processed_dt} to filter for missing events""")
            return max_timestamp

        # if there are multiple processes on the day, then get the max timestamp from the process that ran before the last
        processed_time_filter = daily_processes_df["processed_time"].iloc[1]
        max_timestamp = get_max_timestamp(
            glue_client,
            stage_database,
            stage_target_table,
            max_processed_dt,
            processed_time_filter,
        )
        logger.info(
            f"""Retrieved timestamp:{max_timestamp} from date:{max_processed_dt} process time:{processed_time_filter}
              to filter for missing events"""
        )

        return max_timestamp
    except Exception as e:
        raise QueryException(f"Exception Error retrieving max timestamp for reprocess missing events job {str(e)}")


def get_all_processed_times_per_day(glue_client, stage_database, stage_target_table, max_processed_dt, current_process_time=None):
    """Get all processes that ran on any given day.

    Parameters:
    glue_client (object): An object representing the Glue class.
    stage_target_table (str): The name of the target table in the stage database.
    stage_database (str): The name of the database containing the stage_target_table.
    max_processed_dt(int): The process date to filter for any processes
    current_process_time(int): A value is given if a process is ran on the same day as the last process.
    Used to disregard the current process as this is not necessary

    Returns:
    df: DataFrame with a list off of all processed_times for a given day
    """
    try:
        if glue_client.does_glue_table_exist(stage_database, stage_target_table):
            sql = f"""select distinct processed_time as processed_time
                    from \"{stage_database}\".\"{stage_target_table}\"
                    where processed_dt={max_processed_dt}
                 """

            if current_process_time:
                sql += f""" and processed_time != {current_process_time}"""

            sql += """ order by processed_time desc"""

            logger.info(f"Running query: {sql}")
            dfs = glue_client.query_glue_table(stage_database, sql, 10)

            if dfs is None:
                raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")

            for df in dfs:
                if "processed_time" in df.columns:
                    return df
    except Exception as e:
        raise QueryException(f"Exception Error retrieving daily processes {str(e)}")


def get_max_timestamp(glue_client, stage_database, stage_target_table, processed_dt=None, processed_time=None):
    """
    Get the maximum timestamp from the specified stage table.

    Filters for specific processes if processed_dt or processed_time are provided

    Parameters:
    glue_client (object): An object representing the Glue class.
    stage_target_table (str): The name of the target table in the stage database.
    stage_database (str): The name of the database containing the stage_target_table.
    processed_dt (int): processed date to filter for
    processed_time (int): processed time to filter for

    Returns:
    int: The maximum timestamp value from the stagetable
    """
    try:
        if glue_client.does_glue_table_exist(stage_database, stage_target_table):
            sql = f"""select max(timestamp) as timestamp
                    from \"{stage_database}\".\"{stage_target_table}\"
                 """

            if processed_dt and processed_time:
                sql += f""" where processed_dt={processed_dt} and processed_time={processed_time}"""
            elif processed_dt:
                sql += f""" where processed_dt={processed_dt}"""
            elif processed_time:
                sql += f""" where processed_time={processed_time}"""
            logger.info(f"""Running query: {sql}""")

            dfs = glue_client.query_glue_table(stage_database, sql)

            if dfs is None:
                raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")
            else:
                for df in dfs:
                    if len(df.index) == 1:
                        if "timestamp" in df.columns:
                            # The column exists, so you can work with it
                            timestamp = int(df["timestamp"].iloc[0])
                            return timestamp
                        else:
                            raise QueryException("Stage table does not contain the timestamp column.")

        else:
            return 0
    except Exception as e:
        raise QueryException(f"Exception Error retrieving max timestamp: {str(e)}")


def get_max_processed_dt(glue_client, raw_database, raw_source_table, stage_database, stage_target_table):
    """
    Get the maximum processed_dt from the specified stage table.

    Parameters:
    glue_client (object): An object representing the Glue class.
    raw_database (str): The name of the database containing the raw table.
    raw_source_table (str): The name of the source table in the raw database.
    stage_target_table (str): The name of the target table in the stage database.
    stage_database (str): The name of the database containing the stage_target_table.
    stage_table_exists (bool): True if stage table exists

    Returns:
    int: The maximum processed_dt value from the stagetable,
         or the min value (from the raw table) if the stage table doesn't exist.
    """
    try:
        if glue_client.does_glue_table_exist(stage_database, stage_target_table):
            return get_max_processed_dt_when_table_exists(glue_client, stage_database, stage_target_table)
        else:
            return get_max_processed_dt_when_table_doesnt_exist(glue_client, raw_database, raw_source_table)
    except Exception as e:
        raise QueryException(f"Exception Error retrieving max processed_dt: {str(e)}")


def get_max_processed_dt_when_table_doesnt_exist(glue_client, raw_database, raw_source_table):
    """First processing activity, so return the min(year,month,day) partition value from the raw layer.

    Parameters:
     glue_client
     raw_database
     raw_source_table

    Returns:
     Max processed date
    """
    sql = f'''select min(
                            cast(
                                concat(
                                    cast(year as varchar),
                                    cast(lpad(cast(month as varchar), 2, '0') as varchar),
                                    cast(lpad(cast(day as varchar), 2, '0') as varchar)
                                    )
                                as int
                            )
                    ) as processed_dt
                    from \"{raw_database}\".\"{raw_source_table}\"'''
    dfs = glue_client.query_glue_table(raw_database, sql)
    if dfs is None:
        raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")
    else:
        for df in dfs:
            if len(df.index) == 1:
                if "processed_dt" in df.columns:
                    # The column exists, so you can work with it
                    filter_processed_dt = str(df["processed_dt"].iloc[0])
                    # Minus 1 day from value due to filter query being '> processed_dt'
                    date_obj = datetime.strptime(filter_processed_dt, "%Y%m%d")
                    new_date_obj = date_obj - timedelta(days=1)
                    new_filter_processed_dt = new_date_obj.strftime("%Y%m%d")
                    return new_filter_processed_dt
            else:
                raise QueryException("Error returned querying the raw table for the min(year,month,day) value.")


def get_max_processed_dt_when_table_exists(glue_client, stage_database, stage_target_table):
    """Get max processed date from staging table.

    Parameters:
     glue_client(obj)
     stage_database(str)
     stage_target_table(str)

    Returns:
     max processed date
    """
    sql = f'''select max(
                                        cast(
                                                concat(
                                                        cast(year as varchar),
                                                        cast(lpad(cast(month as varchar), 2, '0') as varchar),
                                                        cast(lpad(cast(day as varchar), 2, '0') as varchar)
                                                    )
                                as int
                                        )
                            ) as processed_dt
                    from \"{stage_database}\".\"{stage_target_table}\"'''
    dfs = glue_client.query_glue_table(stage_database, sql)

    if dfs is None:
        raise ValueError(f"Athena query return value is None, query ran was: {str(sql)}")
    else:
        for df in dfs:
            if len(df.index) == 1:
                if "processed_dt" in df.columns:
                    # The column exists, so you can work with it
                    filter_processed_dt = int(df["processed_dt"].iloc[0])
                    return filter_processed_dt
                else:
                    raise QueryException("Stage table does not contain the processed_dt column.")
