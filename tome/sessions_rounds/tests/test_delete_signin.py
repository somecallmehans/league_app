import pytest
from django.urls import reverse
from rest_framework import status
from utils.test_helpers import get_ids
from sessions_rounds.models import RoundSignups

ids = get_ids()


@pytest.fixture(scope="function")
def build_state() -> None:
    RoundSignups.objects.create(
        participant_id=ids.P4, round_id=ids.R2_SESSION_THIS_MONTH_OPEN
    )


def test_delete_signin_from_lobby(client, build_state) -> None:
    """
    should: delete a participant row from the round signins
    """

    url = reverse("delete_signin")
    body = {"round_id": ids.R2_SESSION_THIS_MONTH_OPEN, "participant_id": ids.P4}
    res = client.delete(url, body, format="json")

    signins = list(RoundSignups.objects.filter(participant_id=ids.P4))
    assert res.status_code == status.HTTP_204_NO_CONTENT
    assert signins == []
