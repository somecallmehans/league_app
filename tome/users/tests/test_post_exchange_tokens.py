import hashlib
from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from users.models import Participants, EditToken, SessionToken


RAW_CODE = "ABCD-EFGH-1234"


def _hash_code(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


@pytest.fixture(scope="function")
def owner(db):
    """
    Create a participant who "owns" decklists.
    Add any required fields your Participants model needs.
    """
    return Participants.objects.create(
        name="Test Teser",
        code="BBBBBB",
        discord_user_id="1234567",
    )


@pytest.fixture(scope="function")
def valid_edit_token(owner):
    """
    Create a valid EditToken row that corresponds to RAW_CODE.
    """
    return EditToken.objects.create(
        owner=owner,
        code_hash=_hash_code(RAW_CODE),
        expires_at=timezone.now() + timedelta(minutes=30),
        used_at=None,
    )


def test_exchange_tokens_missing_code(client) -> None:
    """
    should: reject when code is missing
    """
    url = reverse("exchange_tokens")
    res = client.post(url, {}, format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST


def test_exchange_tokens_invalid_code(client, owner) -> None:
    """
    should: reject invalid code and not mint a session
    """
    url = reverse("exchange_tokens")
    res = client.post(url, {"code": "WRONG-CODE"}, format="json")

    assert res.status_code == status.HTTP_401_UNAUTHORIZED
    assert "edit_decklist_session" not in res.cookies

    assert SessionToken.objects.filter(owner=owner).count() == 0


def test_exchange_tokens_success_sets_cookie_and_mints_session(
    client, owner, valid_edit_token
) -> None:
    """
    should: accept valid edit code, mint session, and set HttpOnly cookie
    """
    url = reverse("exchange_tokens")
    res = client.post(url, {"code": RAW_CODE}, format="json")

    assert res.status_code == status.HTTP_200_OK

    data = res.json()
    assert "expires_at" in data

    # --- cookie is set ---
    assert "edit_decklist_session" in res.cookies
    cookie = res.cookies["edit_decklist_session"]

    assert cookie.value  # non-empty
    # Max-Age comes through in the cookie morsel
    assert int(cookie["max-age"]) == 30 * 60
    assert cookie["httponly"]  # should be True-ish
    assert cookie["samesite"].lower() == "lax"
    assert cookie["path"] == "/"

    # --- session row exists ---
    session = SessionToken.objects.filter(owner=owner).order_by("-created_at").first()
    assert session is not None

    # cookie value should match the minted session id
    assert cookie.value == session.session_id

    # expires_at should be roughly 30 minutes from now
    now = timezone.now()
    assert now < session.expires_at <= now + timedelta(minutes=31)
