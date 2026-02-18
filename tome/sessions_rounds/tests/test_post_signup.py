import pytest

from django.urls import reverse
from rest_framework import status

from users.models import Participants
from sessions_rounds.models import RoundSignups
from stores.models import StoreParticipant
from utils.test_helpers import get_ids

ids = get_ids()

PID = 55
ROUND_LIST = [ids.R1_SESSION_THIS_MONTH_OPEN, ids.R2_SESSION_THIS_MONTH_OPEN]


@pytest.fixture(scope="function")
def build_state() -> None:
    Participants.objects.create(
        id=PID, name="BUILDY STATESON", code="AAAAAA", discord_user_id=12345678
    )
    StoreParticipant.objects.create(participant_id=PID, store_id=ids.MIMICS_ID)


def test_post_signup_with_code(client, build_state) -> None:
    url = reverse("signup")
    body = {
        "code": "AAAAAA",
        "rounds": ROUND_LIST,
    }

    res = client.post(url, body, format="json")

    rounds = list(
        RoundSignups.objects.filter(
            round_id__in=ROUND_LIST, participant_id=PID, store_id=ids.MIMICS_ID
        )
    )

    assert res.status_code == status.HTTP_201_CREATED
    for r in rounds:
        assert r.participant_id == PID
        assert r.round_id in ROUND_LIST
