import pytest

from django.urls import reverse
from rest_framework import status

from users.models import ParticipantAchievements

from utils.test_helpers import get_ids

ids = get_ids()


@pytest.fixture(scope="function")
def populate_achievements_for_participants() -> None:
    """Populate achievements for participants in the current month."""
    # P1 Achievements for R1 This month
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=achievement[0],
                round_id=ids.R1_SESSION_THIS_MONTH_CLOSED,
                session_id=ids.SESSION_THIS_MONTH_CLOSED,
                earned_points=achievement[1],
            )
            for achievement in [(ids.CMDR_DMG, 3), (ids.KILL_TABLE, 5)]
        ]
    )
    # P1 Achievements For R1 This month open
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=achievement[0],
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=achievement[1],
            )
            for achievement in [(ids.ALL_BASICS, 10), (ids.KNOCK_OUT, 3)]
        ]
    )

    # P2 Achievements for R1 This month closed
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P2,
                achievement_id=achievement[0],
                round_id=ids.R1_SESSION_THIS_MONTH_CLOSED,
                session_id=ids.SESSION_THIS_MONTH_CLOSED,
                earned_points=achievement[1],
            )
            for achievement in [
                (ids.NO_CREATURES, 6),
                (ids.NO_INSTANTS_SORCERIES, 6),
                (ids.NO_LANDS, 6),
            ]
        ]
    )

    # P3 Achievements for R1 this month open
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=achievement[0],
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=achievement[1],
            )
            for achievement in [(ids.NO_LANDS, 6)]
        ]
    )


def test_get_achievements_by_participant_no_month(
    client, populate_achievements_for_participants
) -> None:
    """
    should: calculate total points for each participant in the current month,
    i.e. no month is provided in the request.
    """

    expected = [
        {"id": 901, "name": "Charlie Smith", "total_points": 21},
        {"id": 902, "name": "Trenna Thain", "total_points": 18},
        {"id": 903, "name": "Fern Penvarden", "total_points": 6},
    ]

    url = reverse("achievements_for_month")
    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == expected


def test_get_achievements_by_participant_with_new(
    client, populate_achievements_for_participants
) -> None:
    """
    should: calculate total points for each participant in the current month,
    where the param is "new"
    """

    expected = [
        {"id": 901, "name": "Charlie Smith", "total_points": 21},
        {"id": 902, "name": "Trenna Thain", "total_points": 18},
        {"id": 903, "name": "Fern Penvarden", "total_points": 6},
    ]

    url = reverse("achievements_for_month", kwargs={"mm_yy": "new"})
    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == expected


@pytest.fixture(scope="function")
def populate_achievements_for_participants_last_month() -> None:
    """Populate achievements for participants last month."""
    # P1 Achievements for R1 last month
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=achievement[0],
                round_id=ids.R1_SESSION_LAST_MONTH,
                session_id=ids.SESSION_LAST_MONTH,
                earned_points=achievement[1],
            )
            for achievement in [
                (ids.CMDR_DMG, 3),
                (ids.KILL_TABLE, 5),
                (ids.KNOCK_OUT, 3),
            ]
        ]
    )

    # P2 Achievements for R1 last month
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P2,
                achievement_id=achievement[0],
                round_id=ids.R2_SESSION_LAST_MONTH,
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

    # P3 Achievements for R1 last month
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=achievement[0],
                round_id=ids.R2_SESSION_LAST_MONTH,
                session_id=ids.SESSION_LAST_MONTH,
                earned_points=achievement[1],
            )
            for achievement in [(ids.NO_LANDS, 6)]
        ]
    )


def test_get_achievements_by_participant_last_month(
    client, populate_achievements_for_participants_last_month
) -> None:
    """
    should: calculate total points for each participant in the current month,
    i.e. the custom month is provided in the request.
    """

    expected = [
        {"id": 902, "name": "Trenna Thain", "total_points": 18},
        {"id": 901, "name": "Charlie Smith", "total_points": 11},
        {"id": 903, "name": "Fern Penvarden", "total_points": 6},
    ]

    url = reverse("achievements_for_month", kwargs={"mm_yy": "10-24"})
    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == expected
