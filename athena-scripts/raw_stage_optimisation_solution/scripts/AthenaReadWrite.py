import time

import boto3


class AthenaReadWrite:
    """
    A class for interacting with Athena data objects, which is not possible using AWSDataWrangler

    Methods:
        __init__(self)
            Initializes a new AthenaReadWrite instance.

        run_query(self, database, sql, workgroup)
            Runs a query against the Athena service.

    """

    def __init__(self):
        """
        Initialize a new AthenaReadWrite instance.
        """
        self.athena_client = boto3.client("athena", region_name="eu-west-2")

    def run_query(self, database, sql, workgroup):
        """
        Runs input sql statement on Athena.

        Args:
            database (str): The name of the database to set context for sql statement.
            sql (str): The sql statement to execute.
            workgroup (str): Workgroup name to store generated Athena sql outputs

        Returns:
            bool: True if the sql successfully completes, False otherwise.
        """
        try:
            response = self.athena_client.start_query_execution(
                QueryString=sql,
                QueryExecutionContext={"Database": database},
                WorkGroup=workgroup,
            )

            # Get the query execution ID
            query_execution_id = response["QueryExecutionId"]

            # Check the status of the query periodically until it completes
            while True:
                query_execution = self.athena_client.get_query_execution(QueryExecutionId=query_execution_id)
                status = query_execution["QueryExecution"]["Status"]["State"]

                if status in ["SUCCEEDED", "FAILED", "CANCELLED"]:
                    break

                time.sleep(5)  # Wait for 5 seconds before checking again

            if status == "SUCCEEDED":
                print("Athena query successfully completed")
                return True
            else:
                print(f"Error running Athena query. Status: {status}")
                return False
        except Exception as e:
            print(f"Exception when running Athena query: {str(e)}")
            return False
