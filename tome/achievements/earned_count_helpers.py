from collections import Counter
from typing import Iterable, List, Optional, Tuple

from django.db.models import F

from achievements.models import AchievementEarnedCount, AchievementScalableTerms

Pair = Tuple[int, Optional[int]]


def _normalize_pairs(pairs: Iterable[Pair]) -> List[Pair]:
    return list(pairs)


def increment_earned_counts(pairs: Iterable[Pair]) -> None:
    """Increment counts for (achievement_id, scalable_term_id) pairs."""
    counts = Counter(_normalize_pairs(pairs))
    for (achievement_id, scalable_term_id), delta in counts.items():
        AchievementEarnedCount.objects.filter(
            achievement_id=achievement_id,
            scalable_term_id=scalable_term_id,
        ).update(count=F("count") + delta)


def decrement_earned_counts(pairs: Iterable[Pair]) -> None:
    """Decrement counts for (achievement_id, scalable_term_id) pairs."""
    counts = Counter(_normalize_pairs(pairs))
    for (achievement_id, scalable_term_id), delta in counts.items():
        AchievementEarnedCount.objects.filter(
            achievement_id=achievement_id,
            scalable_term_id=scalable_term_id,
        ).update(count=F("count") - delta)


def pairs_from_participant_achievements(records) -> List[Pair]:
    """Extract (achievement_id, scalable_term_id) pairs from ParticipantAchievements rows."""
    pairs = []
    for record in records:
        achievement_id = getattr(record, "achievement_id", None)
        if achievement_id is None and getattr(record, "achievement", None) is not None:
            achievement_id = record.achievement_id
        scalable_term_id = getattr(record, "scalable_term_id", None)
        if achievement_id is not None:
            pairs.append((achievement_id, scalable_term_id))
    return pairs


def pairs_from_queryset_values(rows: list[dict]) -> List[Pair]:
    return [(row["achievement_id"], row.get("scalable_term_id")) for row in rows]


def ensure_earned_count_row(achievement_id: int, scalable_term_id: Optional[int] = None) -> None:
    AchievementEarnedCount.objects.get_or_create(
        achievement_id=achievement_id,
        scalable_term_id=scalable_term_id,
        defaults={"count": 0},
    )


def ensure_earned_count_rows_for_achievement(achievement_id: int) -> None:
    """Create count row for a new non-scalable achievement."""
    scalable_ids = set(
        AchievementScalableTerms.objects.filter(achievement_id=achievement_id).values_list(
            "achievement_id", flat=True
        )
    )
    if achievement_id not in scalable_ids:
        ensure_earned_count_row(achievement_id, None)


def ensure_earned_count_rows_for_bridge(achievement_id: int, scalable_term_id: int) -> None:
    ensure_earned_count_row(achievement_id, scalable_term_id)
