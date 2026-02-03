import pytest

from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import Pods, PodsParticipants
from achievements.models import WinningCommanders
from users.models import ParticipantAchievements


from utils.test_helpers import get_ids

ids = get_ids()

POD_1 = 987
POD_2 = 988
CMDR_ID = 789


round_1_ids = {
    "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    "session_id": ids.SESSION_THIS_MONTH_OPEN,
}


@pytest.mark.parametrize(
    "build_pods_participants",
    [round_1_ids],
    indirect=True,
)
def test_get_pods_by_round(
    client, populate_participation, build_pods_participants
) -> None:
    """Should: return data for all pods in a given round.
    Winner_info should be none for our pods here as a
    round in progress.
    """

    url = reverse("pods", kwargs={"round": ids.R1_SESSION_THIS_MONTH_OPEN})

    expected = {
        "1": {
            "participants": [
                {
                    "participant_id": ids.P1,
                    "name": "Charlie Smith",
                    "total_points": 3,
                    "round_points": 3,
                },
                {
                    "participant_id": ids.P2,
                    "name": "Trenna Thain",
                    "total_points": 3,
                    "round_points": 3,
                },
                {
                    "participant_id": ids.P3,
                    "name": "Fern Penvarden",
                    "total_points": 3,
                    "round_points": 3,
                },
                {
                    "participant_id": ids.P4,
                    "name": "Nikita Heape",
                    "total_points": 3,
                    "round_points": 3,
                },
            ],
            "id": 1,
            "submitted": False,
            "winner_info": None,
        },
        "2": {
            "participants": [
                {
                    "participant_id": ids.P5,
                    "name": "Bevon Goldster",
                    "total_points": 3,
                    "round_points": 3,
                },
                {
                    "participant_id": ids.P6,
                    "name": "Jeffrey Blackwood",
                    "total_points": 3,
                    "round_points": 3,
                },
                {
                    "participant_id": ids.P7,
                    "name": "Amanda Tinnin",
                    "total_points": 3,
                    "round_points": 3,
                },
            ],
            "id": 2,
            "submitted": False,
            "winner_info": None,
        },
        "3": {
            "participants": [
                {
                    "participant_id": ids.P8,
                    "name": "Bless Frankfurt",
                    "total_points": 3,
                    "round_points": 3,
                },
                {
                    "participant_id": ids.P9,
                    "name": "Fran Brek",
                    "total_points": 3,
                    "round_points": 3,
                },
                {
                    "participant_id": ids.P10,
                    "name": "Thom Horn",
                    "total_points": 3,
                    "round_points": 3,
                },
            ],
            "id": 3,
            "submitted": False,
            "winner_info": None,
        },
    }

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK

    assert parsed_res == expected


@pytest.fixture(scope="function")
def build_pods_and_winners():
    Pods.objects.bulk_create(
        [
            Pods(id=POD_1, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN, submitted=True),
            Pods(id=POD_2, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN),
        ]
    )

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(participants_id=pid, pods_id=POD_1)
            for pid in [ids.P2, ids.P4, ids.P8, ids.P9]
        ]
        + [
            PodsParticipants(participants_id=pid, pods_id=POD_2)
            for pid in [ids.P1, ids.P3, ids.P5, ids.P10]
        ]
    )
    ParticipantAchievements.objects.create(
        participant_id=ids.P2,
        achievement_id=ids.WIN_TWO_COLORS,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        session_id=ids.SESSION_THIS_MONTH_OPEN,
        earned_points=4,
    )

    WinningCommanders.objects.create(
        id=CMDR_ID,
        name="Stangg, Echo Warrior",
        pods_id=POD_1,
        participants_id=ids.P2,
        color_id=ids.GRUUL,
    )


@pytest.mark.parametrize(
    "populate_other_achievements",
    [round_1_ids],
    indirect=True,
)
def test_get_pods_by_round_with_winner(
    client, populate_participation, build_pods_and_winners, populate_other_achievements
) -> None:

    url = reverse("pods", kwargs={"round": ids.R1_SESSION_THIS_MONTH_OPEN})

    expected = {
        "987": {
            "id": 987,
            "participants": [
                {
                    "name": "Trenna Thain",
                    "participant_id": 902,
                    "round_points": 7,
                    "total_points": 7,
                },
                {
                    "name": "Nikita Heape",
                    "participant_id": 904,
                    "round_points": 3,
                    "total_points": 3,
                },
                {
                    "name": "Bless Frankfurt",
                    "participant_id": 908,
                    "round_points": 5,
                    "total_points": 5,
                },
                {
                    "name": "Fran Brek",
                    "participant_id": 909,
                    "round_points": 6,
                    "total_points": 6,
                },
            ],
            "submitted": True,
            "winner_info": {
                "colors": {
                    "id": 12,
                    "name": "red green",
                    "slug": "red-green",
                    "symbol": "rg",
                    "symbol_length": 2,
                },
                "deleted": False,
                "id": 789,
                "name": "Stangg, Echo Warrior",
                "participants": {
                    "id": 902,
                    "name": "Trenna Thain",
                    "total_points": 7,
                },
                "pods": {
                    "id": 987,
                    "submitted": True,
                },
            },
        },
        "988": {
            "id": 988,
            "participants": [
                {
                    "name": "Charlie Smith",
                    "participant_id": 901,
                    "round_points": 16,
                    "total_points": 16,
                },
                {
                    "name": "Fern Penvarden",
                    "participant_id": 903,
                    "round_points": 21,
                    "total_points": 21,
                },
                {
                    "name": "Bevon Goldster",
                    "participant_id": 905,
                    "round_points": 3,
                    "total_points": 3,
                },
                {
                    "name": "Thom Horn",
                    "participant_id": 910,
                    "round_points": 3,
                    "total_points": 3,
                },
            ],
            "submitted": False,
            "winner_info": None,
        },
    }

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == expected
