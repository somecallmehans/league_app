import pytest

from django.urls import reverse
from rest_framework import status

from users.models import ParticipantAchievements

from utils.test_helpers import get_ids

ids = get_ids()

PARTICIPANT_ACHIEVEMENT = 100


@pytest.fixture(scope="function")
def build_participant_achievement() -> None:
    """Build an achievement for use in a test"""
    ParticipantAchievements.objects.create(
        id=PARTICIPANT_ACHIEVEMENT,
        participant_id=ids.P1,
        achievement_id=ids.ALL_BASICS,
        session_id=ids.SESSION_THIS_MONTH_OPEN,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        earned_points=15,
    )


def test_post_delete_participant_achievement(
    client, build_participant_achievement
) -> None:
    """
    should: delete the given participant achievement
    """

    url = reverse("upsert_earned_achievements")

    body = {"id": PARTICIPANT_ACHIEVEMENT, "deleted": True}

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    achievement = ParticipantAchievements.objects.filter(
        id=PARTICIPANT_ACHIEVEMENT
    ).first()

    assert achievement == ParticipantAchievements(
        id=PARTICIPANT_ACHIEVEMENT,
        participant_id=ids.P1,
        achievement_id=ids.ALL_BASICS,
        session_id=ids.SESSION_THIS_MONTH_OPEN,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        earned_points=15,
        deleted=True,
    )


def test_post_new_participant_achievement(client) -> None:
    """
    should: insert a new participant achievement
    """
    url = reverse("upsert_earned_achievements")

    body = {
        "participant_id": ids.P9,
        "achievement_id": ids.NO_CREATURES,
        "round_id": ids.R2_SESSION_THIS_MONTH_CLOSED,
    }

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    achievement = ParticipantAchievements.objects.filter(
        participant_id=ids.P9,
        achievement_id=ids.NO_CREATURES,
        round_id=ids.R2_SESSION_THIS_MONTH_CLOSED,
    ).first()

    assert achievement == ParticipantAchievements(
        id=1,
        participant_id=ids.P9,
        achievement_id=ids.NO_CREATURES,
        round_id=ids.R2_SESSION_THIS_MONTH_CLOSED,
        session_id=ids.SESSION_THIS_MONTH_CLOSED,
        earned_points=4,
        deleted=False,
    )
