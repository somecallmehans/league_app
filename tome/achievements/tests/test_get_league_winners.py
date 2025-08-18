import pytest

from django.urls import reverse
from rest_framework import status

from users.models import ParticipantAchievements

from utils.test_helpers import get_ids

ids = get_ids()


@pytest.fixture(scope="function")
def populate_achievements_for_participants() -> None:
    """Populate achievements for participants in the current month."""

    ParticipantAchievements.objects.create(
        participant_id=ids.P1,
        achievement_id=ids.PARTICIPATION,
        round_id=ids.R1_SESSION_LAST_MONTH,
        session_id=ids.SESSION_LAST_MONTH,
        earned_points=3,
    )

    ParticipantAchievements.objects.create(
        participant_id=ids.P3,
        achievement_id=ids.PARTICIPATION,
        round_id=ids.R1_SESSION_LAST_MONTH,
        session_id=ids.SESSION_LAST_MONTH,
        earned_points=3,
    )

    # P2 Achievements for R1 Last month
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P2,
                achievement_id=achievement[0],
                round_id=ids.R1_SESSION_LAST_MONTH,
                session_id=ids.SESSION_LAST_MONTH,
                earned_points=achievement[1],
            )
            for achievement in [
                (ids.NO_CREATURES, 6),
                (ids.NO_INSTANTS_SORCERIES, 6),
                (ids.NO_LANDS, 6),
            ]
        ]
    )


def test_get_league_winners(client, populate_achievements_for_participants) -> None:
    """
    should: return our league champions + their commanders. Should only return one champion for
    each month
    """

    url = reverse("get_league_winners")
    res = client.get(url)

    expected = [
        {
            "session__month_year": "10-24",
            "participant_id": ids.P2,
            "participant_name": "Trenna Thain",
            "total_points": 18,
            "month_i": 10,
            "year_i": 24,
            "year_full": 2024,
        }
    ]

    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == expected
