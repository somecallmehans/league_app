import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import Achievements
from users.models import ParticipantAchievements
from utils.test_helpers import get_ids


ids = get_ids()


@pytest.fixture
def slugless_achievement() -> Achievements:
    return Achievements.objects.create(
        name="Most Earned Test Achievement",
        point_value=1,
        slug=None,
        deleted=False,
    )


def test_most_earned_orders_by_count_and_limits_10(db, client) -> None:
    """Top 10 by earned_count; tie-break by achievement_id ascending."""
    achievements = [
        Achievements.objects.create(
            name=f"Rank test {i}",
            point_value=1,
            slug=None,
            deleted=False,
        )
        for i in range(11)
    ]
    r_id = ids.R1_SESSION_THIS_MONTH_OPEN
    s_id = ids.SESSION_THIS_MONTH_OPEN

    rows = []
    for i, ach in enumerate(achievements):
        count = 11 - i
        for _ in range(count):
            rows.append(
                ParticipantAchievements(
                    participant_id=ids.P1,
                    achievement_id=ach.id,
                    round_id=r_id,
                    session_id=s_id,
                    earned_points=1,
                    store_id=ids.MIMICS_ID,
                    deleted=False,
                )
            )
    ParticipantAchievements.objects.bulk_create(rows)

    url = reverse("most_earned_achievements")
    res = client.get(url)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data) == 10
    assert [row["earned_count"] for row in data] == [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    assert [row["id"] for row in data] == [a.id for a in achievements[:10]]
    assert "full_name" in data[0]
    assert "restrictions" in data[0]


def test_most_earned_excludes_participant_rows_with_deleted_true(
    db, client, slugless_achievement
) -> None:
    r_id = ids.R1_SESSION_THIS_MONTH_OPEN
    s_id = ids.SESSION_THIS_MONTH_OPEN
    ach = slugless_achievement

    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ach.id,
                round_id=r_id,
                session_id=s_id,
                earned_points=1,
                store_id=ids.MIMICS_ID,
                deleted=False,
            ),
            ParticipantAchievements(
                participant_id=ids.P2,
                achievement_id=ach.id,
                round_id=r_id,
                session_id=s_id,
                earned_points=1,
                store_id=ids.MIMICS_ID,
                deleted=True,
            ),
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=ach.id,
                round_id=r_id,
                session_id=s_id,
                earned_points=1,
                store_id=ids.MIMICS_ID,
                deleted=False,
            ),
        ]
    )

    url = reverse("most_earned_achievements")
    res = client.get(url)
    assert res.status_code == status.HTTP_200_OK
    row = next(r for r in res.json() if r["id"] == ach.id)
    assert row["earned_count"] == 2


def test_most_earned_excludes_achievements_with_slug(db, client) -> None:
    """Participant rows tied to slugged achievements do not appear in ranking."""
    r_id = ids.R1_SESSION_THIS_MONTH_OPEN
    s_id = ids.SESSION_THIS_MONTH_OPEN

    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.PARTICIPATION,
                round_id=r_id,
                session_id=s_id,
                earned_points=3,
                store_id=ids.MIMICS_ID,
                deleted=False,
            )
            for _ in range(50)
        ]
    )

    url = reverse("most_earned_achievements")
    res = client.get(url)
    assert res.status_code == status.HTTP_200_OK
    returned_ids = {row["id"] for row in res.json()}
    assert ids.PARTICIPATION not in returned_ids


def test_most_earned_excludes_deleted_achievements(db, client) -> None:
    ach = Achievements.objects.create(
        name="Deleted slugless",
        point_value=1,
        slug=None,
        deleted=True,
    )
    r_id = ids.R1_SESSION_THIS_MONTH_OPEN
    s_id = ids.SESSION_THIS_MONTH_OPEN
    ParticipantAchievements.objects.create(
        participant_id=ids.P1,
        achievement_id=ach.id,
        round_id=r_id,
        session_id=s_id,
        earned_points=1,
        store_id=ids.MIMICS_ID,
        deleted=False,
    )

    url = reverse("most_earned_achievements")
    res = client.get(url)
    assert res.status_code == status.HTTP_200_OK
    returned_ids = {row["id"] for row in res.json()}
    assert ach.id not in returned_ids
