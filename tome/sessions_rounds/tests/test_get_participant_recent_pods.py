import pytest
import pytz

from datetime import datetime, date

from django.urls import reverse
from rest_framework import status

from achievements.models import WinningCommanders
from sessions_rounds.models import Pods, PodsParticipants, Rounds, Sessions
from utils.test_helpers import get_ids

ids = get_ids()

PODS_DICT = {
    "0": [ids.P1, ids.P4, ids.P7, ids.P9],
    "1": [ids.P4, ids.P1, ids.P3, ids.P10],
    "2": [ids.P5, ids.P6, ids.P1],
    "3": [ids.P1, ids.P2, ids.P3, ids.P4, ids.P5],
}

WINNERS_LIST = [
    ("END IN DRAW", None),
    ("Stangg, Echo Warrior", ids.P1),
    ("END IN DRAW", None),
    ("Yarus, Roar of the Old Gods", ids.P5),
]

EXTRA_SESSION = 45
EXTRA_ROUND = 55


@pytest.fixture(scope="function")
def build_pods():
    """Build our pod state"""
    Sessions.objects.create(
        id=EXTRA_SESSION, month_year="11-24", session_date=date(2024, 11, 18)
    )
    Rounds.objects.create(
        id=EXTRA_ROUND,
        session_id=EXTRA_SESSION,
        round_number=1,
        starts_at=datetime(2024, 11, 18, 0, 0, 0, tzinfo=pytz.UTC),
    )

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
        WinningCommanders.objects.create(
            name=WINNERS_LIST[idx][0],
            pods=pod,
            participants_id=WINNERS_LIST[idx][1],
            color_id=ids.GRUUL,
        )
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
        [
            "11/03/2024",
            [
                {
                    "id": 2,
                    "commander_name": "Stangg, Echo Warrior",
                    "round_number": 1,
                    "participants": [
                        {"id": ids.P1, "name": "Charlie Smith", "winner": True},
                        {"id": ids.P3, "name": "Fern Penvarden", "winner": False},
                        {"id": ids.P4, "name": "Nikita Heape", "winner": False},
                        {"id": ids.P10, "name": "Thom Horn", "winner": False},
                    ],
                },
                {
                    "id": 3,
                    "commander_name": "END IN DRAW",
                    "round_number": 2,
                    "participants": [
                        {"id": ids.P1, "name": "Charlie Smith", "winner": False},
                        {"id": ids.P5, "name": "Bevon Goldster", "winner": False},
                        {"id": ids.P6, "name": "Jeffrey Blackwood", "winner": False},
                    ],
                },
            ],
        ],
        [
            "11/18/2024",
            [
                {
                    "id": 4,
                    "commander_name": "Yarus, Roar of the Old Gods",
                    "round_number": 1,
                    "participants": [
                        {"id": ids.P1, "name": "Charlie Smith", "winner": False},
                        {"id": ids.P2, "name": "Trenna Thain", "winner": False},
                        {"id": ids.P3, "name": "Fern Penvarden", "winner": False},
                        {"id": ids.P4, "name": "Nikita Heape", "winner": False},
                        {"id": ids.P5, "name": "Bevon Goldster", "winner": True},
                    ],
                }
            ],
        ],
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


SESSION_LAST_MONTH = 33
ROUND_LAST_MONTH = 44


@pytest.fixture(scope="function")
def build_pods_last_month():
    """Build our pod state"""
    Sessions.objects.create(
        id=SESSION_LAST_MONTH, month_year="10-24", session_date=date(2024, 10, 18)
    )
    Rounds.objects.create(
        id=ROUND_LAST_MONTH,
        session_id=SESSION_LAST_MONTH,
        round_number=1,
        starts_at=datetime(2024, 10, 18, 0, 0, 0, tzinfo=pytz.UTC),
    )

    pods = Pods.objects.bulk_create(
        Pods(rounds_id=rid)
        for rid in [
            ids.R2_SESSION_LAST_MONTH,
            ROUND_LAST_MONTH,
        ]
    )
    for idx, pod in enumerate(pods):
        WinningCommanders.objects.create(
            name=WINNERS_LIST[idx][0],
            pods=pod,
            participants_id=WINNERS_LIST[idx][1],
            color_id=ids.GRUUL,
        )
        PodsParticipants.objects.bulk_create(
            PodsParticipants(pods=pod, participants_id=pid)
            for pid in PODS_DICT[str(idx)]
        )


def test_get_recent_pods_last_month(client, build_pods_last_month) -> None:
    """
    should: get all of the pods for a given participant they appear in for the given month
    """

    url = reverse(
        "get_participant_recent_pods",
        kwargs={"participant_id": ids.P1, "mm_yy": "10-24"},
    )
    res = client.get(url)

    parsed_res = res.json()

    expected = [
        [
            "10/18/2024",
            [
                {
                    "id": 2,
                    "commander_name": "Stangg, Echo Warrior",
                    "round_number": 1,
                    "participants": [
                        {"id": ids.P1, "name": "Charlie Smith", "winner": True},
                        {"id": ids.P3, "name": "Fern Penvarden", "winner": False},
                        {"id": ids.P4, "name": "Nikita Heape", "winner": False},
                        {"id": ids.P10, "name": "Thom Horn", "winner": False},
                    ],
                },
            ],
        ],
        [
            "10/28/2024",
            [
                {
                    "commander_name": "END IN DRAW",
                    "id": 1,
                    "participants": [
                        {
                            "id": 901,
                            "name": "Charlie Smith",
                            "winner": False,
                        },
                        {
                            "id": 904,
                            "name": "Bevon Goldster",
                            "name": "Nikita Heape",
                            "winner": False,
                        },
                        {
                            "id": 907,
                            "name": "Amanda Tinnin",
                            "winner": False,
                        },
                        {
                            "id": 909,
                            "name": "Jeffrey Blackwood",
                            "name": "Fran Brek",
                            "winner": False,
                        },
                    ],
                    "round_number": 2,
                },
            ],
        ],
    ]

    assert res.status_code == status.HTTP_200_OK

    assert parsed_res == expected
