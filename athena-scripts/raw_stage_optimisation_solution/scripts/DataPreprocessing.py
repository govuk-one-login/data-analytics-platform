import datetime
from datetime import datetime
import awswrangler as wr
import pandas as pd
import numpy as np

class DataPreprocessing:
    """
        
    A class for performing preprocessing tasks against a supplied dataframe

    """
    def __init__(self):
        self.now = datetime.now()
        self.processed_dt = int(self.now.strftime("%Y%m%d"))

    def remove_duplicate_rows(self, df, fields):
        """
        Remove duplicate rows based on the specified fields.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (list): A list of column names to consider when identifying duplicates.

        Returns:
        DataFrame: A DataFrame with duplicates removed.
        """
        try:
            if not isinstance(fields, (list)):
                raise ValueError("Invalid field list structure provided, require list object")
            return df.drop_duplicates(subset=fields)
        except Exception as e:
            print(f"Error dropping row duplicates: {str(e)}")
            return None
        
    def remove_rows_missing_mandatory_values(self, df, fields):
        """
        Remove rows with missing mandatory field values.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (list): A list of column names with mandatory values.

        Returns:
        DataFrame: A DataFrame with rows containing mandatory values.
        """
        try:
            if not isinstance(fields, (list)):
                raise ValueError("Invalid field list structure provided, require list object")
            return df.dropna(subset=fields)
        except Exception as e:
            print(f"Error dropping rows missing mandatory field: {str(e)}")
            return None
        
    def rename_column_names(self, df, fields):
        """
        Rename column names based on the provided mapping.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (dict): A dictionary where keys are old column names, and values are new column names.

        Returns:
        DataFrame: A DataFrame with renamed columns.
        """
        try:
            if not isinstance(fields, (dict)):
                raise ValueError("Invalid field list structure provided, require dict object")
            return df.rename(columns=fields)
        except Exception as e:
            print(f"Error renaming columns: {str(e)}")
            return None
        
    def add_new_column(self, df, fields):
        """
        Add new columns to the DataFrame.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (dict): A dictionary where keys are new column names, and values are their corresponding values.

        Returns:
        DataFrame: A DataFrame with new columns added.
        """
        try:
            if not isinstance(fields, (dict)):
                raise ValueError("Invalid field list structure provided, require dict object")
            for column_name, value in fields.items():
                if column_name == 'processed_dt':
                    df[column_name] = self.processed_dt
            return df
        except Exception as e:
            print(f"Error adding new columns: {str(e)}")
            return None
        
    def add_new_column_from_struct(self, df, fields):
        """
        Create new columns from struct fields in the DataFrame.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (dict): A dictionary where keys are the new column names,
            and values are the corresponding struct fields to extract.

        Returns:
        DataFrame: A DataFrame with new columns added from struct fields.
        """
        try:
            if not isinstance(fields, (dict)):
                raise ValueError("Invalid field list structure provided, require dict object")
            
            for key, value in fields.items():
                for item in value:
                    col_name = f'{key}_{item}'
                    df[col_name] =  df.apply(lambda x: None if x[key] is None or x[key].get(item) is None or (not x[key].get(item).strip()) else x[key].get(item), axis=1)

            return df
        except Exception as e:
            print(f"Error adding new columns from struct: {str(e)}")
            return None
        
    def empty_string_to_null(self, df, fields):
        """
        Replace empty strings with None (null) in the specified columns.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (list): A list of column names where empty strings should be replaced with None.

        Returns:
        DataFrame: A DataFrame with empty strings replaced by None.
        """
        try:
            if not isinstance(fields, (list)):
                raise ValueError("Invalid field list structure provided, require list object")
            
            for column_name in fields:
                df[column_name] = df[column_name].apply(lambda x: None if isinstance(x, str) and (x.isspace() or not x) else x)
    
            return df
        except Exception as e:
            print(f"Error replacing empty string with sql nulls: {str(e)}")
            return None
        

    
    def extract_key_values(self, obj, parent_key='', sep='.', field_name=''):
        """
        Generate Key/Value records for provided object.

        Parameters:
        obj (dict, primitive (i.e. str, int): The input to extract key-value pairs from (can be of any type)
        parent_key (str): The parent key used for recursion.
        sep (str): The separator used to join parent and child keys.
        field_name (str): Name of the field from the raw df, that the input obj is associated to

        Returns:
        list: A list of (key, value) pairs generated from the input obj argument.
        """
        try:
        
            items = []
            if not isinstance(obj, (dict, list)):
                items.append((field_name, obj))
            else:
                for key, value in obj.items():
                    if value is None:
                        pass
                    else:
                        new_key = f"{parent_key}{sep}{key}" if parent_key else key
                        if isinstance(value, dict):
                            items.extend(self.extract_key_values(value, new_key))
                        elif isinstance(value, list):
                            for i, item in enumerate(value):
                                if isinstance(item, (dict, list)):
                                    items.extend(self.extract_key_values(item, f"{new_key}[{i}]"))
                                else:
                                    items.append((new_key, item))
                        elif isinstance(value, np.ndarray):
                            for i, item in enumerate(value):
                                if isinstance(item, (dict, list)):
                                    items.extend(self.extract_key_values(item, f"{new_key}[{i}]"))
                                else:
                                    items.append((new_key, item))
                        else:
                            if isinstance(value, str):  # Check if item is a string
                                try:
                                    value = float(value)  # Attempt to convert the string to a float
                                except ValueError:
                                    pass  # Ignore if conversion fails
                            if isinstance(value, (int, float)):
                                try:
                                    if isinstance(value, float) and value.is_integer():
                                        value = int(value)
                                except ValueError:
                                    pass  # Ignore if conversion fails
                            items.append((new_key, value))
            return items
        
        except Exception as e:
            print(f"Error extracting key/value: {str(e)}")
            return None
        
    
    def generate_key_value_records(self, df, fields, column_names_list):
        """
        Generate Key/Value records from nested struct fields in the DataFrame.

        Parameters:
        df (DataFrame): The input DataFrame.
        fields (list): A list of column names with nested struct fields to extract.
        column_names_list (list): A list of column names for the resulting DataFrame.

        Returns:
        DataFrame: A DataFrame with extracted Key/Value records from nested struct fields.
        """
        try:
            if not isinstance(fields, (list)):
                raise ValueError("Invalid field list structure provided, require list object")
            
            # Initialize an empty list to store DataFrames
            dfs = []
            
            for column_name in fields:
                df_key_value = df.apply(lambda row: [(row['event_id'], column_name, key, value) for key, value in self.extract_key_values(row[column_name], field_name=column_name)] if pd.notna(row[column_name]) else [], axis=1)
                dfs.append(df_key_value)
                
            print(f'class: DataPreprocessing | method=generate_key_value_records | dfs row count: {len(dfs)}')

            key_value_pairs = pd.concat(dfs, ignore_index=True)
            
            # Flatten the list of lists into a single list
            key_value_pairs = [item for sublist in key_value_pairs for item in sublist]

            # Create the "extensions_key_values" DataFrame
            result_df = pd.DataFrame(key_value_pairs, columns=['event_id', 'parent_column_name', 'key', 'value'])

            # Filter out rows with null values
            result_df = result_df[result_df['value'].notna()]
            result_df['processed_dt'] = self.processed_dt
            result_df.columns = column_names_list
            
            return result_df
        except Exception as e:
            print(f"Error generating key/value records: {str(e)}")
            return None
        
    
        

