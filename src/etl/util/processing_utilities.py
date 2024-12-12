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
            raise ValueError("Invalid JSON data provided")

        if isinstance(json_data, dict):
            if parent_name is None:
                if element_name in json_data:
                    return json_data[element_name]
            elif parent_name in json_data and element_name in json_data[parent_name]:
                return json_data[parent_name][element_name]
            
            for key, value in json_data.items():
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
        print(f"Exception Error retrieving config rule value: {str(e)}")
        return None
    
    