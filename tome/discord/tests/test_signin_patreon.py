from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from sessions_rounds.models import Rounds, Sessions
from stores.models import StoreParticipant
from users.models import Participants
from utils.test_helpers import get_ids

ids = get_ids()

DISCORD_USER_ID = 987654321
ROUND_LIST = [ids.R1_SESSION_THIS_MONTH_OPEN, ids.R2_SESSION_THIS_MONTH_OPEN]


@pytest.fixture(scope="function")
def discord_client(settings):
    settings.SERVICE_TOKEN = "test-token"
    api = APIClient()
    api.credentials(
        HTTP_AUTHORIZATION="X-SERVICE-TOKEN test-token",
        HTTP_X_DISCORD_GUILD_ID="1123750208937938964",
    )
    return api


@pytest.fixture(scope="function")
def linked_participant(db):
    participant = Participants.objects.create(
        name="Patreon Tester",
        code="PPPPPP",
        discord_user_id=DISCORD_USER_ID,
    )
    StoreParticipant.objects.create(
        participant_id=participant.id, store_id=ids.MIMICS_ID
    )
    return participant


@pytest.fixture(scope="function")
def patreon_window_session(db):
    now = timezone.now()
    session = Sessions.objects.get(id=ids.SESSION_THIS_MONTH_OPEN)
    session.created_at = now - timedelta(hours=1)
    session.session_date = now.date()
    session.save(update_fields=["created_at", "session_date"])

    Rounds.objects.filter(session=session).update(
        starts_at=now + timedelta(days=5),
    )
    return session


def test_next_session_includes_patreon_only_flag(
    discord_client, patreon_window_session
) -> None:
    url = reverse("next_session")
    res = discord_client.get(url)
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["patreon_only"] is True


def test_next_session_blocks_non_patreon_user(
    discord_client, linked_participant, patreon_window_session
) -> None:
    url = reverse("next_session")
    res = discord_client.get(url, {"discord_user_id": DISCORD_USER_ID})
    parsed = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed["signin_blocked"] is True
    assert "Patreon subscribers" in parsed["message"]


def test_next_session_allows_patreon_user(
    discord_client, linked_participant, patreon_window_session
) -> None:
    linked_participant.is_patreon = True
    linked_participant.save(update_fields=["is_patreon"])

    url = reverse("next_session")
    res = discord_client.get(url, {"discord_user_id": DISCORD_USER_ID})
    parsed = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed.get("signin_blocked") is not True


def test_discord_signin_rejects_non_patreon_during_window(
    discord_client, linked_participant, patreon_window_session
) -> None:
    url = reverse("signin")
    res = discord_client.post(
        url,
        {"discord_user_id": DISCORD_USER_ID, "rounds": ROUND_LIST},
        format="json",
    )

    assert res.status_code == status.HTTP_403_FORBIDDEN
    assert "Patreon subscribers" in res.json()["message"]


def test_discord_signin_allows_patreon_during_window(
    discord_client, linked_participant, patreon_window_session
) -> None:
    linked_participant.is_patreon = True
    linked_participant.save(update_fields=["is_patreon"])

    url = reverse("signin")
    res = discord_client.post(
        url,
        {"discord_user_id": DISCORD_USER_ID, "rounds": ROUND_LIST},
        format="json",
    )

    assert res.status_code == status.HTTP_201_CREATED
