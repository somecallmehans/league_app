from typing import Any

from csv import reader
from pathlib import Path
from functools import cache
from dataclasses import dataclass, field
from conftest import SEED_DIRECTORY


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


def id_from_csv_row(csv_path: str, index: int) -> Any:
    path = SEED_DIRECTORY / Path(f"{csv_path}.csv")
    with path.open() as f:
        seed_reader = reader(f)
        header = next(seed_reader)
        id_idx = header.index("id")
        unique_ids = sorted({int(row[id_idx]) for row in seed_reader})
    return field(default_factory=lambda: unique_ids[index])


@dataclass
class Identifiers:
    """
    Holds the primary keys for testdb records for use
    in other places.
    """

    P1: int = id_from_csv_row("100_participants", 0)
    P2: int = id_from_csv_row("100_participants", 1)
    P3: int = id_from_csv_row("100_participants", 2)
    P4: int = id_from_csv_row("100_participants", 3)
    P5: int = id_from_csv_row("100_participants", 4)
    P6: int = id_from_csv_row("100_participants", 5)
    P7: int = id_from_csv_row("100_participants", 6)
    P8: int = id_from_csv_row("100_participants", 7)
    P9: int = id_from_csv_row("100_participants", 8)
    P10: int = id_from_csv_row("100_participants", 9)

    SESSION_LAST_MONTH: int = id_from_csv_row("200_sessions", 0)
    SESSION_THIS_MONTH_CLOSED: int = id_from_csv_row("200_sessions", 1)
    SESSION_THIS_MONTH_OPEN: int = id_from_csv_row("200_sessions", 2)

    R1_SESSION_LAST_MONTH: int = id_from_csv_row("250_rounds", 0)
    R2_SESSION_LAST_MONTH: int = id_from_csv_row("250_rounds", 1)
    R1_SESSION_THIS_MONTH_CLOSED: int = id_from_csv_row("250_rounds", 2)
    R2_SESSION_THIS_MONTH_CLOSED: int = id_from_csv_row("250_rounds", 3)
    R1_SESSION_THIS_MONTH_OPEN: int = id_from_csv_row("250_rounds", 4)
    R2_SESSION_THIS_MONTH_OPEN: int = id_from_csv_row("250_rounds", 5)

    PARTICIPATION: int = id_from_csv_row("400_achievements", 0)
    KILL_TABLE: int = id_from_csv_row("400_achievements", 1)
    NO_INSTANTS_SORCERIES: int = id_from_csv_row("400_achievements", 2)
    NO_CREATURES: int = id_from_csv_row("400_achievements", 3)
    NO_LANDS: int = id_from_csv_row("400_achievements", 4)
    ALL_BASICS: int = id_from_csv_row("400_achievements", 5)
    CMDR_DMG: int = id_from_csv_row("400_achievements", 6)
    DRAW: int = id_from_csv_row("400_achievements", 7)
    SNACK: int = id_from_csv_row("400_achievements", 8)
    KNOCK_OUT: int = id_from_csv_row("400_achievements", 9)
    WIN_TWO_COLORS: int = id_from_csv_row("400_achievements", 10)

    COLORLESS: int = id_from_csv_row("600_colors", 0)
    GREEN: int = id_from_csv_row("600_colors", 1)
    GRUUL: int = id_from_csv_row("600_colors", 2)
    ESPER: int = id_from_csv_row("600_colors", 3)


@cache
def get_ids() -> Identifiers:
    """Return the singleton of identifiers"""
    return Identifiers()
