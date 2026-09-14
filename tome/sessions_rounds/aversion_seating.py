"""Round 1 seating that honors participant aversions via retry-then-repair."""

from __future__ import annotations

import logging
import random
from typing import Iterable, Sequence

from users.models import Aversions

logger = logging.getLogger(__name__)

RETRY_ATTEMPTS = 5


def partition_into_pods(ordered_ids: Sequence[int]) -> list[list[int]]:
    """Mirror sessions_rounds.helpers.make_bridge_records chunking without DB."""
    ids = list(ordered_ids)
    length = len(ids)
    if length == 0:
        return []

    pod_mod = length % 4
    if pod_mod == 1:
        pods_needed = ((length - 5) // 4) + 1
    elif pod_mod == 2:
        pods_needed = ((length - 6) // 4) + 2
    elif pod_mod == 3:
        pods_needed = ((length - 3) // 4) + 1
    else:
        pods_needed = length // 4

    groups: list[list[int] | None] = [None] * pods_needed

    if pod_mod == 1:
        groups[-1] = ids[-5:]
        ids = ids[:-5]
        fill_indexes = range(pods_needed - 1)
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


def _pod_index_by_participant(pods: Sequence[Sequence[int]]) -> dict[int, int]:
    return {pid: i for i, pod in enumerate(pods) for pid in pod}


def count_violations(
    ordered_ids: Sequence[int], aversion_pairs: Sequence[tuple[int, int]]
) -> int:
    pods = partition_into_pods(ordered_ids)
    pod_of = _pod_index_by_participant(pods)
    violations = 0
    for low_id, high_id in aversion_pairs:
        if low_id not in pod_of or high_id not in pod_of:
            continue
        if pod_of[low_id] == pod_of[high_id]:
            violations += 1
    return violations


def _violating_pairs(
    ordered_ids: Sequence[int], aversion_pairs: Sequence[tuple[int, int]]
) -> list[tuple[int, int]]:
    pods = partition_into_pods(ordered_ids)
    pod_of = _pod_index_by_participant(pods)
    return [
        (low_id, high_id)
        for low_id, high_id in aversion_pairs
        if low_id in pod_of
        and high_id in pod_of
        and pod_of[low_id] == pod_of[high_id]
    ]


def _swap_ids(ordered_ids: list[int], a: int, b: int) -> list[int]:
    result = list(ordered_ids)
    i, j = result.index(a), result.index(b)
    result[i], result[j] = result[j], result[i]
    return result


def repair_adjacent_pods(
    ordered_ids: Sequence[int], aversion_pairs: Sequence[tuple[int, int]]
) -> list[int]:
    """Break co-podded aversions by swapping with adjacent-pod players (oldest first)."""
    current = list(ordered_ids)
    for low_id, high_id in aversion_pairs:
        pods = partition_into_pods(current)
        pod_of = _pod_index_by_participant(pods)
        if low_id not in pod_of or high_id not in pod_of:
            continue
        if pod_of[low_id] != pod_of[high_id]:
            continue

        pod_idx = pod_of[low_id]
        current_violations = count_violations(current, aversion_pairs)
        best = None
        best_score = current_violations

        for member in (low_id, high_id):
            for adj in (pod_idx - 1, pod_idx + 1):
                if adj < 0 or adj >= len(pods):
                    continue
                for candidate in pods[adj]:
                    candidate_order = _swap_ids(current, member, candidate)
                    # Must separate this pair
                    cand_pods = partition_into_pods(candidate_order)
                    cand_pod_of = _pod_index_by_participant(cand_pods)
                    if cand_pod_of[low_id] == cand_pod_of[high_id]:
                        continue
                    score = count_violations(candidate_order, aversion_pairs)
                    if score < best_score:
                        best_score = score
                        best = candidate_order
                    elif score == best_score and best is None:
                        best = candidate_order

        if best is not None:
            current = best

    return current


def load_aversion_pairs(participant_ids: Iterable[int]) -> list[tuple[int, int]]:
    ids = set(participant_ids)
    if not ids:
        return []
    rows = (
        Aversions.objects.filter(
            participant_low_id__in=ids, participant_high_id__in=ids
        )
        .order_by("id")
        .values_list("participant_low_id", "participant_high_id")
    )
    return list(rows)


def order_participants_for_round_one(
    participants: list, retries: int = RETRY_ATTEMPTS, rng=None
) -> list:
    """
    Shuffle with retries, then adjacent-pod repair. Logs any remaining violations.
    Returns the (possibly reordered) participant objects for generate_pods.
    """
    if rng is None:
        rng = random

    by_id = {p.id: p for p in participants}
    ordered_ids = [p.id for p in participants]
    aversion_pairs = load_aversion_pairs(ordered_ids)
    if not aversion_pairs:
        rng.shuffle(ordered_ids)
        return [by_id[i] for i in ordered_ids]

    best_ids = None
    best_score = None
    for _ in range(retries):
        candidate = list(ordered_ids)
        rng.shuffle(candidate)
        score = count_violations(candidate, aversion_pairs)
        if best_score is None or score < best_score:
            best_score = score
            best_ids = candidate
            if score == 0:
                break

    assert best_ids is not None
    if best_score and best_score > 0:
        best_ids = repair_adjacent_pods(best_ids, aversion_pairs)

    remaining = _violating_pairs(best_ids, aversion_pairs)
    for low_id, high_id in remaining:
        logger.warning(
            "Unsatisfied aversion after Round 1 seating: participants %s and %s",
            low_id,
            high_id,
        )

    return [by_id[i] for i in best_ids]
