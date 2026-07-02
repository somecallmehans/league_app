from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from achievements.models import Achievements, AchievementScalableTerms, AchievementEarnedCount
from django.db.models import Sum

RARITY_TIERS = (
    ("Most Popular", "#9CA3AF"),
    ("Uncommon", "#6B8BA4"),
    ("Rare", "#DAA520"),
    ("Mythic", "#D43220"),
)

RARITY_ORDER = {name: idx for idx, (name, _) in enumerate(RARITY_TIERS)}


def _assign_rarity_by_percentile(items: list[tuple[int, int]]) -> dict[int, tuple[str, str]]:
    """
    Assign rarity based on percentile rank within a peer group.
    items: list of (key, count) sorted by count descending.
    Returns map key -> (rarity_name, rarity_hex).
    """
    if not items:
        return {}

    n = len(items)
    if n == 1:
        return {items[0][0]: RARITY_TIERS[0]}

    result = {}
    for rank, (key, _count) in enumerate(items):
        percentile = rank / (n - 1)
        if percentile <= 0.10:
            tier = RARITY_TIERS[0]
        elif percentile <= 0.50:
            tier = RARITY_TIERS[1]
        elif percentile <= 0.90:
            tier = RARITY_TIERS[2]
        else:
            tier = RARITY_TIERS[3]
        result[key] = tier
    return result


def _get_scalable_achievement_ids() -> set[int]:
    return set(
        AchievementScalableTerms.objects.values_list("achievement_id", flat=True).distinct()
    )


def _build_parent_child_map() -> Tuple[Dict[int, Optional[int]], Dict[int, List[int]]]:
    parent_by_id: Dict[int, Optional[int]] = {}
    children_by_parent: dict[int, list[int]] = defaultdict(list)

    for row in Achievements.objects.filter(deleted=False).values("id", "parent_id"):
        parent_by_id[row["id"]] = row["parent_id"]
        if row["parent_id"] is not None:
            children_by_parent[row["parent_id"]].append(row["id"])

    return parent_by_id, children_by_parent


def _load_earned_count_maps() -> Tuple[Dict[Tuple[int, Optional[int]], int], Dict[int, int]]:
    """Returns (pair_counts, achievement_null_counts)."""
    pair_counts: Dict[Tuple[int, Optional[int]], int] = {}
    achievement_null_counts: dict[int, int] = {}

    rows = (
        AchievementEarnedCount.objects.filter(achievement__deleted=False)
        .values("achievement_id", "scalable_term_id")
        .annotate(total=Sum("count"))
    )
    for row in rows:
        key = (row["achievement_id"], row["scalable_term_id"])
        pair_counts[key] = row["total"] or 0
        if row["scalable_term_id"] is None:
            achievement_null_counts[row["achievement_id"]] = row["total"] or 0

    return pair_counts, achievement_null_counts


def compute_achievement_rarity_map() -> dict[int, tuple[str, str]]:
    """
    Compute rarity for display achievements (roots and standalone non-scalable).
    """
    scalable_ids = _get_scalable_achievement_ids()
    _parent_by_id, children_by_parent = _build_parent_child_map()
    _pair_counts, achievement_null_counts = _load_earned_count_maps()

    achievement_type = {
        row["id"]: row["type_id"]
        for row in Achievements.objects.filter(deleted=False).values("id", "type_id")
    }

    display_counts: dict[int, int] = {}

    for achievement_id, type_id in achievement_type.items():
        if type_id is None:
            continue
        if achievement_id in scalable_ids:
            continue

        parent_id = _parent_by_id.get(achievement_id)
        if parent_id is not None:
            continue

        total = achievement_null_counts.get(achievement_id, 0)
        for child_id in children_by_parent.get(achievement_id, []):
            total += achievement_null_counts.get(child_id, 0)
        display_counts[achievement_id] = total

    by_type: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for achievement_id, count in display_counts.items():
        type_id = achievement_type.get(achievement_id)
        if type_id is not None:
            by_type[type_id].append((achievement_id, count))

    rarity_by_achievement: dict[int, tuple[str, str]] = {}
    for _type_id, items in by_type.items():
        sorted_items = sorted(items, key=lambda x: (-x[1], x[0]))
        rarity_map = _assign_rarity_by_percentile(sorted_items)
        rarity_by_achievement.update(rarity_map)

    return rarity_by_achievement


def attach_rarity_to_achievement_payloads(
    payloads: list[dict],
    rarity_by_achievement: Optional[Dict[int, Tuple[str, str]]] = None,
) -> list[dict]:
    """Attach rarity fields to serialized achievement dicts."""
    if rarity_by_achievement is None:
        rarity_by_achievement = compute_achievement_rarity_map()

    scalable_ids = _get_scalable_achievement_ids()

    for row in payloads:
        achievement_id = row.get("id")
        parent_id = row.get("parent_id")

        if achievement_id in scalable_ids or (
            parent_id is not None
            and parent_id in scalable_ids
        ):
            row["rarity"] = None
            row["rarity_hex"] = None
            continue

        if parent_id is not None:
            tier = rarity_by_achievement.get(parent_id)
        else:
            tier = rarity_by_achievement.get(achievement_id)

        if tier:
            row["rarity"], row["rarity_hex"] = tier
        else:
            row["rarity"] = None
            row["rarity_hex"] = None

    return payloads
