import pytest

from django.urls import reverse
from rest_framework import status

from utils.test_helpers import get_ids, prune_fields

from sessions_rounds.models import Pods, PodsParticipants
from achievements.models import WinningCommanders
from users.models import ParticipantAchievements

ids = get_ids()

round_1_ids = {
    "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    "session_id": ids.SESSION_THIS_MONTH_OPEN,
}

POD_ID = 987
CMDR_ID = 789

GET_NO_WINNER_EXPECTED = {
    ids.P2: [ids.PARTICIPATION],
    ids.P4: [ids.PARTICIPATION],
    ids.P8: [ids.PARTICIPATION, ids.KNOCK_OUT],
    ids.P9: [ids.PARTICIPATION, ids.SNACK],
}


@pytest.fixture(scope="function")
def build_pod() -> None:
    Pods.objects.create(id=POD_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(participants_id=pid, pods_id=POD_ID)
            for pid in [ids.P2, ids.P4, ids.P8, ids.P9]
        ]
    )


@pytest.mark.parametrize(
    "populate_other_achievements",
    [round_1_ids],
    indirect=True,
)
def test_get_achievements_by_pod_no_winner(
    client, populate_participation, populate_other_achievements, build_pod
) -> None:
    """
    Should: return the achievements that were earned by all of the
    participants in a given pod.
    """

    url = reverse("pods_achievements", kwargs={"pod": POD_ID})

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK

    assert parsed_res["winning_commander"] == None

    for item in parsed_res["pod_achievements"]:
        participant_id = item["participant_id"]
        assert item["achievement_id"] in GET_NO_WINNER_EXPECTED[participant_id]


@pytest.fixture(scope="function")
def build_pods_and_winner():
    Pods.objects.create(id=POD_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_CLOSED)

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(participants_id=pid, pods_id=POD_ID)
            for pid in [ids.P2, ids.P4, ids.P8, ids.P9]
        ]
    )

    ParticipantAchievements.objects.create(
        participant_id=ids.P2,
        achievement_id=ids.WIN_TWO_COLORS,
        round_id=ids.R1_SESSION_THIS_MONTH_CLOSED,
        session_id=ids.SESSION_THIS_MONTH_CLOSED,
        earned_points=4,
    )

    WinningCommanders.objects.create(
        id=CMDR_ID,
        name="Stangg, Echo Warrior",
        pods_id=POD_ID,
        participants_id=ids.P2,
        colors_id=ids.GRUUL,
    )


EXPECTED_WINNER = {
    "id": CMDR_ID,
    "name": "Stangg, Echo Warrior",
    "colors": {"id": ids.GRUUL, "name": "red green"},
    "pods": {"id": POD_ID},
    "participants": {"id": ids.P2, "name": "Trenna Thain"},
}

GET_WINNER_EXPECTED = {
    ids.P2: [ids.WIN_TWO_COLORS],
    ids.P4: [],
    ids.P8: [ids.KNOCK_OUT],
    ids.P9: [ids.SNACK],
}


@pytest.mark.parametrize(
    "populate_other_achievements",
    [
        {
            "round_id": ids.R1_SESSION_THIS_MONTH_CLOSED,
            "session_id": ids.SESSION_THIS_MONTH_CLOSED,
        }
    ],
    indirect=True,
)
def test_get_achievements_by_pod_winner(
    client, populate_other_achievements, build_pods_and_winner
) -> None:
    """
    Should: return the achievements that were earned by all of the
    participants in a given pod, including the winner
    """

    url = reverse("pods_achievements", kwargs={"pod": POD_ID})

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK

    assert (
        prune_fields(parsed_res["winning_commander"], {"id", "name"}) == EXPECTED_WINNER
    )
    for item in parsed_res["pod_achievements"]:
        participant_id = item["participant_id"]
        assert item["achievement_id"] in GET_WINNER_EXPECTED[participant_id]
