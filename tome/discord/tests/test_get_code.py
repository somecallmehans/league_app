import pytest

from django.urls import reverse
from rest_framework import status

from users.models import Participants


@pytest.fixture(scope="function")
def add_participant_with_code() -> None:
    """Add one participant with a code + id"""
    Participants.objects.create(
        name="Cody Codeson", deleted=False, discord_user_id="1234567", code="AAAAAA"
    )


@pytest.fixture(scope="function")
def add_participant_with_code_unlinked() -> None:
    """Add one participant with a code + id"""
    Participants.objects.create(
        name="Cody Codeson", deleted=False, discord_user_id=None, code="BBBBBB"
    )


def test_get_code(client, add_participant_with_code) -> None:
    """
    should: get a code for a given participant
    """

    url = reverse("mycode", kwargs={"discord_user_id": 1234567})
    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res["code"] == "AAAAAA"


def test_get_code_fail(client, add_participant_with_code_unlinked) -> None:
    """
    should: fail if we send a code and nothing gets returned
    """
    url = reverse("mycode", kwargs={"discord_user_id": 1234567})
    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert parsed_res["message"] == "No code found, participant likely unlinked."
