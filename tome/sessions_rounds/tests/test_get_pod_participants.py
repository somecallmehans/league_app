import pytest

from django.urls import reverse
from rest_framework import status
from utils.test_helpers import get_ids
from sessions_rounds.models import Pods, PodsParticipants

ids = get_ids()

POD_ID = 123


@pytest.fixture(scope="function")
def build_state() -> None:
    Pods.objects.create(id=POD_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)
    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(pods_id=POD_ID, participants_id=pid)
            for pid in [ids.P1, ids.P2, ids.P3, ids.P4]
        ]
    )


def test_get_pod_participants(client, build_state) -> None:
    """should: return all participants for a given pod."""

    url = reverse("get_pod_participants", kwargs={"pod_id": POD_ID})

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == [
        {
            "id": 901,
            "name": "Charlie Smith",
        },
        {
            "id": 902,
            "name": "Trenna Thain",
        },
        {
            "id": 903,
            "name": "Fern Penvarden",
        },
        {
            "id": 904,
            "name": "Nikita Heape",
        },
    ]
