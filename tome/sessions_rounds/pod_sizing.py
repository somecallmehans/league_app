"""Canonical pod size partitioning for seating generation."""

from __future__ import annotations

from typing import Sequence


def partition_into_pods(
    ordered_ids: Sequence[int], prefer_5_pod: bool = True
) -> list[list[int]]:
    """
    Split ordered participant ids into pod-sized groups.

    Prefer pods of 4. Remainder handling:
    - mod 0: all 4s
    - mod 2: trailing two 3s
    - mod 3: trailing one 3
    - mod 1 + prefer_5 (or fewer than 9 players): trailing one 5
    - mod 1 + not prefer_5 and n >= 9: trailing three 3s (sacrifice a 4)
    """
    ids = list(ordered_ids)
    length = len(ids)
    if length == 0:
        return []

    pod_mod = length % 4
    use_five = pod_mod == 1 and (prefer_5_pod or length == 5)
    use_three_threes = pod_mod == 1 and not use_five

    if use_five:
        pods_needed = ((length - 5) // 4) + 1
    elif use_three_threes:
        pods_needed = ((length - 9) // 4) + 3
    elif pod_mod == 2:
        pods_needed = ((length - 6) // 4) + 2
    elif pod_mod == 3:
        pods_needed = ((length - 3) // 4) + 1
    else:
        pods_needed = length // 4

    groups: list[list[int] | None] = [None] * pods_needed

    if use_five:
        groups[-1] = ids[-5:]
        ids = ids[:-5]
        fill_indexes = range(pods_needed - 1)
    elif use_three_threes:
        groups[-1] = ids[-3:]
        ids = ids[:-3]
        groups[-2] = ids[-3:]
        ids = ids[:-3]
        groups[-3] = ids[-3:]
        ids = ids[:-3]
        fill_indexes = range(pods_needed - 3)
    elif pod_mod == 2:
        groups[-1] = ids[-3:]
        ids = ids[:-3]
        groups[-2] = ids[-3:]
        ids = ids[:-3]
        fill_indexes = range(pods_needed - 2)
    elif pod_mod == 3:
        groups[-1] = ids[-3:]
        ids = ids[:-3]
        fill_indexes = range(pods_needed - 1)
    else:
        fill_indexes = range(pods_needed)

    for i in fill_indexes:
        groups[i] = ids[:4]
        ids = ids[4:]

    return [g for g in groups if g is not None]
