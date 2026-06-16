from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from sessions_rounds.helpers import is_patreon_only_window
from sessions_rounds.models import Rounds, Sessions
from stores.models import StoreParticipant
from users.models import Participants
from utils.test_helpers import get_ids

ids = get_ids()

PID = 55
ROUND_LIST = [ids.R1_SESSION_THIS_MONTH_OPEN, ids.R2_SESSION_THIS_MONTH_OPEN]


@pytest.fixture(scope="function")
def build_state() -> None:
    Participants.objects.create(
        id=PID,
        name="BUILDY STATESON",
        code="AAAAAA",
        discord_user_id=12345678,
    )
    StoreParticipant.objects.create(participant_id=PID, store_id=ids.MIMICS_ID)


@pytest.fixture(scope="function")
def patreon_participant(build_state) -> None:
    Participants.objects.filter(id=PID).update(is_patreon=True)


@pytest.fixture(scope="function")
def patreon_window_session(db):
    """Session created recently with round far enough out for a 24h Patreon window."""
    now = timezone.now()
    session = Sessions.objects.get(id=ids.SESSION_THIS_MONTH_OPEN)
    session.created_at = now - timedelta(hours=1)
    session.save(update_fields=["created_at"])

    Rounds.objects.filter(session=session).update(
        starts_at=now + timedelta(days=5),
    )
    return session


@pytest.fixture(scope="function")
def open_to_all_session(db):
    """Session where general sign-ins are already open."""
    now = timezone.now()
    session = Sessions.objects.get(id=ids.SESSION_THIS_MONTH_OPEN)
    session.created_at = now - timedelta(hours=30)
    session.save(update_fields=["created_at"])

    Rounds.objects.filter(session=session).update(
        starts_at=now + timedelta(days=5),
    )
    return session


@pytest.fixture(scope="function")
def near_round_session(db):
    """Session created recently but round starts within 48h."""
    now = timezone.now()
    session = Sessions.objects.get(id=ids.SESSION_THIS_MONTH_OPEN)
    session.created_at = now - timedelta(hours=1)
    session.save(update_fields=["created_at"])

    Rounds.objects.filter(session=session).update(
        starts_at=now + timedelta(hours=24),
    )
    return session


def test_is_patreon_only_window_during_first_24h(patreon_window_session) -> None:
    assert is_patreon_only_window(patreon_window_session) is True


def test_is_patreon_only_window_after_24h(open_to_all_session) -> None:
    assert is_patreon_only_window(open_to_all_session) is False


def test_is_patreon_only_window_opens_early_within_48h_of_round(near_round_session) -> None:
    assert is_patreon_only_window(near_round_session) is False


def test_post_signup_rejects_non_patreon_during_window(
    client, build_state, patreon_window_session
) -> None:
    url = reverse("signup")
    body = {"code": "AAAAAA", "rounds": ROUND_LIST}

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_403_FORBIDDEN
    assert "Patreon subscribers" in res.json()["message"]


def test_post_signup_allows_patreon_during_window(
    client, patreon_participant, patreon_window_session
) -> None:
    url = reverse("signup")
    body = {"code": "AAAAAA", "rounds": ROUND_LIST}

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED


def test_post_signup_allows_non_patreon_after_window(
    client, build_state, open_to_all_session
) -> None:
    url = reverse("signup")
    body = {"code": "AAAAAA", "rounds": ROUND_LIST}

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED


def test_signin_counts_includes_patreon_only_flag(
    client, patreon_window_session
) -> None:
    url = reverse("signin_counts")
    res = client.get(
        url,
        {
            "round_one": ids.R1_SESSION_THIS_MONTH_OPEN,
            "round_two": ids.R2_SESSION_THIS_MONTH_OPEN,
        },
    )

    assert res.status_code == status.HTTP_200_OK
    assert res.json()["patreon_only"] is True
