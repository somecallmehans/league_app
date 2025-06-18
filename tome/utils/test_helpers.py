def prune_fields(data, fields_to_keep):
    """
    Recursively remove all keys from nested dictionaries that are not in `fields_to_keep`.
    Works for dicts and lists of dicts.
    """
    if isinstance(data, dict):
        return {
            k: prune_fields(v, fields_to_keep)
            for k, v in data.items()
            if k in fields_to_keep or isinstance(v, (list, dict))
        }
    elif isinstance(data, list):
        return [prune_fields(item, fields_to_keep) for item in data]
    return data
