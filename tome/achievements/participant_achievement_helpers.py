"""
Helpers for resolving ParticipantAchievement display data.
Supports both legacy (achievement_id = child) and new (achievement_id + scalable_term_id) modes.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from users.models import ParticipantAchievements


def resolve_participant_achievement_display(pa: "ParticipantAchievements") -> dict:
    """
    Resolve full_name and earned_points for a ParticipantAchievement.
    Legacy: scalable_term_id is null, achievement is child with parent.
    New: scalable_term_id is set, achievement is parent, full_name = achievement.name + " " + term.
    """
    if pa.scalable_term_id is None:
        # Legacy: achievement is child, use achievement.full_name and stored earned_points
        return {
            "full_name": pa.achievement.full_name,
            "earned_points": pa.earned_points,
        }
    # New: achievement is parent, use achievement.name + term.term_display
    full_name = f"{pa.achievement.name} {pa.scalable_term.term_display}"
    return {
        "full_name": full_name,
        "earned_points": pa.earned_points,
    }
