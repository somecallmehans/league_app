import pytest

from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status


from users.models import Participants, EditToken

PID = 5555


@pytest.fixture(scope="function")
def add_participant_with_code() -> None:
    """Add one participant with a code + id"""
    Participants.objects.create(
        id=PID,
        name="Cody Codeson",
        deleted=False,
        discord_user_id="1234567",
        code="BBBBBB",
    )


@pytest.fixture(scope="function")
def client(settings):
    settings.SERVICE_TOKEN = "test-token"
    api = APIClient()
    api.credentials(HTTP_AUTHORIZATION="X-SERVICE-TOKEN test-token")
    return api


def test_post_retrieve_token(client, add_participant_with_code) -> None:
    """
    should: create a fresh edit token for a user
    """

    url = reverse("issue_edit_token")
    res = client.post(url, {"discord_user_id": 1234567}, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    assert EditToken.objects.filter(owner_id=PID, revoked_at=None).exists()


def test_post_revoke_and_create_token(client, add_participant_with_code) -> None:
    """
    should: revoke the existing token and make a new one
    """

    url = reverse("issue_edit_token")
    client.post(url, {"discord_user_id": 1234567}, format="json")

    res = client.post(url, {"discord_user_id": 1234567}, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    tokens = EditToken.objects.filter(owner_id=PID)

    assert tokens[0].revoked_at is not None
    assert tokens[1].revoked_at is None
