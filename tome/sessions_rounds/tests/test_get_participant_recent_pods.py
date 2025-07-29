import pytest
import pytz

from datetime import datetime

from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import Pods, PodsParticipants, Rounds, Sessions
from utils.test_helpers import get_ids

ids = get_ids()

PODS_DICT = {
    "0": [ids.P1, ids.P4, ids.P7, ids.P9],
    "1": [ids.P4, ids.P1, ids.P3, ids.P10],
    "2": [ids.P5, ids.P6, ids.P1],
    "3": [ids.P1, ids.P2, ids.P3, ids.P4, ids.P5],
}

EXTRA_SESSION = 45
EXTRA_ROUND = 55


@pytest.fixture(scope="function")
def build_pods():
    """Build our pod state"""
    session = Sessions.objects.create(
        id=EXTRA_SESSION, month_year="11-24", created_at=""
    )
    round = Rounds.objects.create(
        id=EXTRA_ROUND, session_id=EXTRA_SESSION, round_number=1, created_at=""
    )
    session.created_at = datetime(2024, 11, 18, 0, 0, 0, tzinfo=pytz.UTC)
    round.created_at = datetime(2024, 11, 18, 0, 0, 0, tzinfo=pytz.UTC)
    session.save(update_fields=["created_at"])
    round.save(update_fields=["created_at"])

    pods = Pods.objects.bulk_create(
        Pods(rounds_id=rid)
        for rid in [
            ids.R2_SESSION_LAST_MONTH,
            ids.R1_SESSION_THIS_MONTH_CLOSED,
            ids.R2_SESSION_THIS_MONTH_CLOSED,
            EXTRA_ROUND,
        ]
    )
    for idx, pod in enumerate(pods):
        PodsParticipants.objects.bulk_create(
            PodsParticipants(pods=pod, participants_id=pid)
            for pid in PODS_DICT[str(idx)]
        )


def test_get_participant_recent_pods(client, build_pods) -> None:
    """
    should: get all of the pods for a given participant that they appeared in
    this month
    """

    url = reverse("get_participant_recent_pods", kwargs={"participant_id": ids.P1})
    res = client.get(url)

    parsed_res = res.json()

    expected = [
        {
            "id": 4,
            "occurred": "11/18/2024",
            "round_number": 1,
            "participants": [
                {"id": 901, "name": "Charlie Smith"},
                {"id": 902, "name": "Trenna Thain"},
                {"id": 903, "name": "Fern Penvarden"},
                {"id": 904, "name": "Nikita Heape"},
                {"id": 905, "name": "Bevon Goldster"},
            ],
        },
        {
            "id": 2,
            "occurred": "11/3/2024",
            "round_number": 1,
            "participants": [
                {"id": 901, "name": "Charlie Smith"},
                {"id": 903, "name": "Fern Penvarden"},
                {"id": 904, "name": "Nikita Heape"},
                {"id": 910, "name": "Thom Horn"},
            ],
        },
        {
            "id": 3,
            "occurred": "11/3/2024",
            "round_number": 2,
            "participants": [
                {"id": 901, "name": "Charlie Smith"},
                {"id": 905, "name": "Bevon Goldster"},
                {"id": 906, "name": "Jeffrey Blackwood"},
            ],
        },
    ]

    assert res.status_code == status.HTTP_200_OK

    assert parsed_res == expected


def test_get_participants_recent_pods_none(client) -> None:
    """
    If the participant doesn't have any pods, return an empty list
    """

    url = reverse("get_participant_recent_pods", kwargs={"participant_id": ids.P8})
    res = client.get(url)

    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK

    assert parsed_res == []


def test_get_participants_recent_pods_fail(client) -> None:
    """
    If the participant doesn't exist, return an error
    """

    url = reverse("get_participant_recent_pods", kwargs={"participant_id": 1290})
    res = client.get(url)

    assert res.status_code == status.HTTP_400_BAD_REQUEST
