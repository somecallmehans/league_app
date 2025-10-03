import pytest
from django.urls import reverse
from rest_framework import status
from utils.test_helpers import get_ids

from sessions_rounds.models import RoundSignups

ids = get_ids()


def test_post_signin_from_lobby(client) -> None:
    """
    should: Post a new signin to the table
    """
    url = reverse("post_signin")
    body = {"round_id": ids.R2_SESSION_THIS_MONTH_OPEN, "participant_id": ids.P4}

    res = client.post(url, body, format="json")

    signins = list(RoundSignups.objects.filter(participant_id=ids.P4))

    assert res.status_code == status.HTTP_201_CREATED
    for s in signins:
        assert s.participant_id == ids.P4
        assert s.round_id == ids.R2_SESSION_THIS_MONTH_OPEN


@pytest.fixture(scope="function")
def build_state() -> None:
    RoundSignups.objects.create(
        participant_id=ids.P4, round_id=ids.R2_SESSION_THIS_MONTH_OPEN
    )


def test_post_signin_from_lobby_exists(client, build_state) -> None:
    """
    should: return 200 but don't dup records
    """

    url = reverse("post_signin")
    body = {"round_id": ids.R2_SESSION_THIS_MONTH_OPEN, "participant_id": ids.P4}

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_200_OK
    assert res.json()["message"] == "User already exists for round."
    signup_count = RoundSignups.objects.filter(
        participant_id=ids.P4, round_id=ids.R2_SESSION_THIS_MONTH_OPEN
    ).count()
    assert signup_count == 1


def test_post_signin_from_lobby_fail(client) -> None:
    """
    should: return 400
    """

    url = reverse("post_signin")
    body = {"participant_id": ids.P4}

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()["message"] == "Missing round or participant in request."
