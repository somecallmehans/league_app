from typing import Any, Callable, Optional

from .models import Config

# Config type constants
CONFIG_TYPE_TEXT = "text"
CONFIG_TYPE_NUMBER = "number"
CONFIG_TYPE_SELECT = "select"
CONFIG_TYPE_CHECKBOX = "checkbox"

DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


def to_int(v: Any) -> int:
    return int(v)


def to_float(v: Any) -> float:
    return float(v)


def _validate_number(
    v: Any, min_val: Optional[int] = None, max_val: Optional[int] = None
) -> int:
    n = int(v)
    if min_val is not None and n < min_val:
        raise ValueError(f"Must be at least {min_val}")
    if max_val is not None and n > max_val:
        raise ValueError(f"Must be at most {max_val}")
    return n


def _validate_select(v: Any, options: list[str]) -> str:
    s = str(v).strip()
    if s not in options:
        raise ValueError(f"Must be one of: {', '.join(options)}")
    return s


# def _validate_checkbox(v: Any) -> str:
#     s = str(v).strip().lower()
#     if s in ("true", "1", "yes", "y"):
#         return "true"
#     if s in ("false", "0", "no", "n"):
#         return "false"
#     raise ValueError("Must be true or false")


# Registry entry: type, name, description, and optional options/cast/validate
CONFIG_REGISTRY: dict[str, dict[str, Any]] = {
    "round_one_cap": {
        "type": CONFIG_TYPE_NUMBER,
        "name": "Round One Cap",
        "description": "Max players allowed in Round 1",
        "cast": to_int,
        "validate": lambda v: _validate_number(v, min_val=3, max_val=99),
    },
    "round_two_cap": {
        "type": CONFIG_TYPE_NUMBER,
        "name": "Round Two Cap",
        "description": "Max players allowed in Round 2",
        "cast": to_int,
        "validate": lambda v: _validate_number(v, min_val=3, max_val=99),
    },
    "round_day": {
        "type": CONFIG_TYPE_SELECT,
        "name": "Round Day",
        "description": "The day each week that league occurs",
        "options": DAYS_OF_WEEK,
        "validate": lambda v: _validate_select(v, DAYS_OF_WEEK),
    },
    "round_one_start": {
        "type": CONFIG_TYPE_TEXT,
        "name": "Round One Start",
        "description": "The start time for round 1",
    },
    "round_two_start": {
        "type": CONFIG_TYPE_TEXT,
        "name": "Round Two Start",
        "description": "The start time for round 2",
    },
    "enable_snack_sharing": {
        "type": CONFIG_TYPE_CHECKBOX,
        "name": "Enable Snack Sharing Achievement",
        "description": "Show 'Did anyone bring a snack to share?' and snack awards in scorecards and achievements page",
    },
    "enable_money_pack": {
        "type": CONFIG_TYPE_CHECKBOX,
        "name": "Enable Money Pack Achievement",
        "description": "Show 'Did anyone participate with a booster pack purchased for more than $10?' in scorecards and achievements page",
    },
}

# Default values for non-interactive seeding (create_configs --defaults, sync_configs)
DEFAULT_VALUES: dict[str, str] = {
    "round_one_cap": "24",
    "round_two_cap": "24",
    "round_day": "Wednesday",
    "round_one_start": "1:30PM",
    "round_two_start": "3:30PM",
    "enable_snack_sharing": "true",
    "enable_money_pack": "true",
}

# Legacy CONFIG_SPEC for backward compatibility (get_round_caps, etc.)
CONFIG_SPEC: dict[str, dict[str, Callable[[Any], Any]]] = {
    key: {"cast": entry["cast"]}
    for key, entry in CONFIG_REGISTRY.items()
    if "cast" in entry
}


def get_config_schema(key: str) -> dict[str, Any]:
    """Return config_type and options for a key, for API/frontend."""
    entry = CONFIG_REGISTRY.get(key)
    if not entry:
        return {"config_type": CONFIG_TYPE_TEXT}
    schema = {"config_type": entry["type"]}
    if "options" in entry:
        schema["options"] = entry["options"]
    return schema


def get_round_caps(store_id: int) -> tuple[int, int]:
    caps = dict(
        Config.objects.filter(
            key__in=["round_one_cap", "round_two_cap"], store_id=store_id
        ).values_list("key", "value")
    )
    r1_cast = CONFIG_SPEC["round_one_cap"]["cast"]
    r2_cast = CONFIG_SPEC["round_two_cap"]["cast"]
    return (
        r1_cast(caps.get("round_one_cap", 24)),
        r2_cast(caps.get("round_two_cap", 24)),
    )
