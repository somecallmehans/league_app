from datetime import date

import pytest
from django.urls import reverse
from rest_framework import status

from achievements.models import WinningCommanders
from sessions_rounds.models import Pods, Rounds, Sessions
from users.models import ParticipantAchievements
from utils.test_helpers import get_ids

ids = get_ids()

SESSION_ID = 9001
ROUND_ONE_ID = 9002
ROUND_TWO_ID = 9003
POD_ONE_ID = 9004
POD_TWO_ID = 9005
WINNER_ID = 9006


@pytest.fixture(scope="function")
def session_delete_state() -> None:
    """Session with rounds, pods, achievements, and a winning commander."""
    session = Sessions.objects.create(
        id=SESSION_ID,
        month_year="11-24",
        session_date=date(2024, 11, 25),
        store_id=ids.MIMICS_ID,
        deleted=False,
    )
    Rounds.objects.create(id=ROUND_ONE_ID, session=session, round_number=1)
    Rounds.objects.create(id=ROUND_TWO_ID, session=session, round_number=2)

    Pods.objects.create(
        id=POD_ONE_ID,
        rounds_id=ROUND_ONE_ID,
        store_id=ids.MIMICS_ID,
        deleted=False,
    )
    Pods.objects.create(
        id=POD_TWO_ID,
        rounds_id=ROUND_TWO_ID,
        store_id=ids.MIMICS_ID,
        deleted=False,
    )

    ParticipantAchievements.objects.create(
        participant_id=ids.P1,
        achievement_id=ids.PARTICIPATION,
        round_id=ROUND_ONE_ID,
        session_id=SESSION_ID,
        earned_points=3,
        store_id=ids.MIMICS_ID,
        deleted=False,
    )
    ParticipantAchievements.objects.create(
        participant_id=ids.P2,
        achievement_id=ids.KNOCK_OUT,
        round_id=ROUND_TWO_ID,
        session_id=SESSION_ID,
        earned_points=2,
        store_id=ids.MIMICS_ID,
        deleted=False,
    )

    WinningCommanders.objects.create(
        id=WINNER_ID,
        name="Test Commander",
        pods_id=POD_ONE_ID,
        participants_id=ids.P1,
        color_id=ids.GRUUL,
        store_id=ids.MIMICS_ID,
        deleted=False,
    )


def test_delete_session_soft_deletes_cascade(client, session_delete_state) -> None:
    """DELETE should soft-delete session, rounds, pods, achievements, and winners."""
    url = reverse("delete_session", kwargs={"session_id": SESSION_ID})
    res = client.delete(url)

    assert res.status_code == status.HTTP_204_NO_CONTENT
    assert Sessions.objects.get(id=SESSION_ID).deleted is True
    assert not Rounds.objects.filter(
        id__in=[ROUND_ONE_ID, ROUND_TWO_ID], deleted=False
    ).exists()
    assert not Pods.objects.filter(
        id__in=[POD_ONE_ID, POD_TWO_ID], deleted=False
    ).exists()
    assert not ParticipantAchievements.objects.filter(
        round_id__in=[ROUND_ONE_ID, ROUND_TWO_ID], deleted=False
    ).exists()
    assert WinningCommanders.objects.get(id=WINNER_ID).deleted is True


def test_delete_session_returns_404_when_already_deleted(
    client, session_delete_state
) -> None:
    """Second delete on the same session should return 404."""
    url = reverse("delete_session", kwargs={"session_id": SESSION_ID})
    assert client.delete(url).status_code == status.HTTP_204_NO_CONTENT
    assert client.delete(url).status_code == status.HTTP_404_NOT_FOUND
