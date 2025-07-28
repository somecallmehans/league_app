import pytest

from django.urls import reverse
from rest_framework import status

from users.models import ParticipantAchievements
from achievements.models import Achievements

from utils.test_helpers import get_ids

ids = get_ids()


@pytest.fixture(scope="function")
def populate_round_achievements() -> None:
    achievements = Achievements.objects.filter(
        id__in=[
            ids.ALL_BASICS,
            ids.CMDR_DMG,
            ids.KNOCK_OUT,
            ids.NO_CREATURES,
        ]
    ).values("id", "point_value")
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                id=idx + 1,
                participant_id=ids.P1,
                achievement_id=achievement["id"],
                round_id=ids.R1_SESSION_LAST_MONTH,
                session_id=ids.SESSION_LAST_MONTH,
                earned_points=achievement["point_value"],
            )
            for idx, achievement in enumerate(achievements)
        ]
    )


def test_get_participant_round_achievements(
    client, populate_round_achievements
) -> None:
    """
    should: return a dict of achievements name and earned point info for
    a given participant + round
    """

    url = reverse(
        "get_participant_round_achievements",
        kwargs={"participant_id": ids.P1, "round_id": ids.R1_SESSION_LAST_MONTH},
    )
    res = client.get(url)
    parsed_res = res.json()

    expected = [
        {
            "id": 1,
            "full_name": "Win with no creatures except your commander",
            "earned_points": 4,
        },
        {
            "id": 2,
            "full_name": "Win with 88 or more basic lands",
            "earned_points": 11,
        },
        {
            "id": 3,
            "full_name": "Win via commander damage",
            "earned_points": 1,
        },
        {
            "id": 4,
            "full_name": "Knock out",
            "earned_points": 2,
        },
    ]

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == expected
