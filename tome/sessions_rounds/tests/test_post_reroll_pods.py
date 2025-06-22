import pytest
from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import Pods, PodsParticipants
from users.models import Participants, ParticipantAchievements
from utils.test_helpers import get_ids

ids = get_ids()

round_1_ids = {
    "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    "session_id": ids.SESSION_THIS_MONTH_OPEN,
}
round_2_ids = {
    "round_id": ids.R2_SESSION_THIS_MONTH_OPEN,
    "session_id": ids.SESSION_THIS_MONTH_OPEN,
}


def get_existing_pods_participants():
    return list(
        PodsParticipants.objects.all()
        .values("pods_id", "participants_id")
        .order_by("pods_id")
    )


@pytest.mark.parametrize(
    "build_pods_participants",
    [round_1_ids],
    indirect=True,
)
def test_post_reroll_pods_round_one(
    client, base_participants_list, build_pods_participants
) -> None:
    """
    Should: take the existing pods_participants relations,
    blow them away and return them aligned in a way that befits round one.
    """

    url = reverse("reroll_pods")

    req_body = {
        "participants": base_participants_list,
        "round": ids.R1_SESSION_THIS_MONTH_OPEN,
    }

    existing_pods = get_existing_pods_participants()

    res = client.post(url, req_body, format="json")

    new_pods = list(
        PodsParticipants.objects.filter(pods_id__in=[1, 2, 3])
        .values("pods_id", "participants_id")
        .order_by("pods_id")
    )

    assert res.status_code == status.HTTP_201_CREATED
    # Somewhat flaky assertion but should do the job
    assert new_pods != existing_pods


@pytest.mark.parametrize(
    "build_pods_participants",
    [round_1_ids],
    indirect=True,
)
def test_post_reroll_pods_round_one_add_players(
    client, base_participants_list, build_pods_participants
) -> None:
    """Should blow away our existing pods participants relations
    and build new players for the round.

    Additionally, should add another pod to fit everyone.
    """

    new_players = [
        {"name": "Finn the Human", "isNew": True},
        {"name": "Jake the Dog", "isNew": True},
        {"name": "BMO", "isNew": True},
        {"name": "Shelby", "isNew": True},
    ]

    url = reverse("reroll_pods")

    req_body = {
        "participants": base_participants_list + new_players,
        "round": ids.R1_SESSION_THIS_MONTH_OPEN,
    }

    existing_pods = get_existing_pods_participants()

    res = client.post(url, req_body, format="json")

    new_pods = list(
        PodsParticipants.objects.all()
        .values("pods_id", "participants_id")
        .order_by("pods_id")
    )

    assert res.status_code == status.HTTP_201_CREATED

    assert new_pods != existing_pods

    assert Participants.objects.filter(
        name__in=[player["name"] for player in new_players]
    ).exists()

    new_participation = ParticipantAchievements.objects.filter(
        participant__name__in=[player["name"] for player in new_players],
        achievement_id=ids.PARTICIPATION,
    ).count()

    assert new_participation == 4
    assert Pods.objects.all().count() == 4


@pytest.mark.parametrize(
    "build_pods_participants",
    [round_1_ids],
    indirect=True,
)
def test_post_reroll_pods_round_one_remove_players(
    client, base_participants_list, build_pods_participants
) -> None:
    """
    Should: remove players from our pods_participants for a pod
    if we don't include them in the request. Side effect of this,
    we should be down a pod in that table if we have less players
    to support them.
    """

    url = reverse("reroll_pods")

    req_body = {
        "participants": base_participants_list[:8],
        "round": ids.R1_SESSION_THIS_MONTH_OPEN,
    }

    existing_pods = get_existing_pods_participants()

    res = client.post(url, req_body, format="json")

    new_pods = list(
        PodsParticipants.objects.all()
        .values("pods_id", "participants_id")
        .order_by("pods_id")
    )

    assert res.status_code == status.HTTP_201_CREATED

    assert new_pods != existing_pods

    assert PodsParticipants.objects.values("pods_id").distinct().count() == 2
    assert PodsParticipants.objects.values("pods_id").count() == 8

    existing_participants = set(
        PodsParticipants.objects.values_list("participants_id", flat=True)
    )

    assert ids.P9 not in existing_participants
    assert ids.P10 not in existing_participants


r2_pods_start = [
    {"pods_id": 1, "participants_id": ids.P6},
    {"pods_id": 1, "participants_id": ids.P1},
    {"pods_id": 1, "participants_id": ids.P3},
    {"pods_id": 1, "participants_id": ids.P9},
    {"pods_id": 2, "participants_id": ids.P4},
    {"pods_id": 2, "participants_id": ids.P8},
    {"pods_id": 2, "participants_id": ids.P2},
    {"pods_id": 3, "participants_id": ids.P5},
    {"pods_id": 3, "participants_id": ids.P10},
    {"pods_id": 3, "participants_id": ids.P7},
]


@pytest.mark.parametrize(
    ("populate_other_achievements"),
    [round_1_ids],
    indirect=True,
)
def test_post_reroll_pods_round_two(
    client,
    populate_other_achievements,
    base_participants_list,
    populate_participation,
) -> None:
    """Should: take in a list of participants and sort them
    based on standing.

    Participants should already be sorted by point value for r2,
    and since we're not adding/removing anyone this essentially does nothing
    """

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(participants_id=p["participants_id"], pods_id=p["pods_id"])
            for p in r2_pods_start
        ]
    )

    url = reverse("reroll_pods")

    req_body = {
        "participants": base_participants_list,
        "round": ids.R2_SESSION_THIS_MONTH_OPEN,
    }

    res = client.post(url, req_body, format="json")

    new_pods = list(
        PodsParticipants.objects.filter(pods_id__in=[1, 2, 3])
        .values("pods_id", "participants_id")
        .order_by("pods_id")
    )

    assert res.status_code == status.HTTP_201_CREATED
    assert new_pods == r2_pods_start


@pytest.mark.parametrize(
    ("populate_other_achievements"),
    [round_1_ids],
    indirect=True,
)
def test_post_reroll_pods_round_two_add_players(
    client,
    populate_other_achievements,
    base_participants_list,
    populate_participation,
) -> None:
    """
    Should: Add our new participants into the existing round structure.

    Additionally, should add an extra pod.
    """

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(participants_id=p["participants_id"], pods_id=p["pods_id"])
            for p in r2_pods_start
        ]
    )

    new_players = [
        {"name": "Finn the Human", "isNew": True},
        {"name": "Jake the Dog", "isNew": True},
        {"name": "BMO", "isNew": True},
        {"name": "Shelby", "isNew": True},
    ]

    url = reverse("reroll_pods")

    req_body = {
        "participants": base_participants_list + new_players,
        "round": ids.R2_SESSION_THIS_MONTH_OPEN,
    }

    res = client.post(url, req_body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    top_pod = PodsParticipants.objects.filter(pods_id=1).values_list(
        "participants_id", flat=True
    )

    for id in [p["participants_id"] for p in r2_pods_start[:4]]:
        assert id in top_pod

    assert Pods.objects.all().count() == 4


@pytest.mark.parametrize(
    ("populate_other_achievements"),
    [round_1_ids],
    indirect=True,
)
def test_post_reroll_pods_round_two_remove_players(
    client,
    populate_other_achievements,
    base_participants_list,
    populate_participation,
) -> None:
    """
    Should: Reroll pods when we remove some players. Top pod
    should take a different shape if we remove one of the players.
    """

    Pods.objects.bulk_create(
        [
            Pods(rounds_id=ids.R2_SESSION_THIS_MONTH_OPEN),
            Pods(rounds_id=ids.R2_SESSION_THIS_MONTH_OPEN),
            Pods(rounds_id=ids.R2_SESSION_THIS_MONTH_OPEN),
        ]
    )

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(participants_id=p["participants_id"], pods_id=p["pods_id"])
            for p in r2_pods_start
        ]
    )

    url = reverse("reroll_pods")

    # Want to specifically remove one of our top earners
    # and someone who would just have participation
    mutated_list = base_participants_list.copy()
    del mutated_list[5]
    del mutated_list[8]

    req_body = {
        "participants": mutated_list,
        "round": ids.R2_SESSION_THIS_MONTH_OPEN,
    }

    res = client.post(url, req_body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    top_pod = list(
        PodsParticipants.objects.filter(pods_id=1).values_list(
            "participants_id", flat=True
        )
    )

    for id in [ids.P1, ids.P3, ids.P9, ids.P8]:
        assert id in top_pod

    assert PodsParticipants.objects.values("pods_id").distinct().count() == 2
    assert PodsParticipants.objects.values("pods_id").count() == 8

    existing_participants = set(
        PodsParticipants.objects.values_list("participants_id", flat=True)
    )

    assert ids.P6 not in existing_participants
    assert ids.P10 not in existing_participants


def test_post_reroll_pods_not_enough_players(client, base_participants_list) -> None:
    """Should: if our participants list has < 3 players in, raise an exception
    and return 400."""

    url = reverse("reroll_pods")

    mutated_list = base_participants_list.copy()

    req_body = {
        "participants": mutated_list[:2],
        "round": ids.R1_SESSION_THIS_MONTH_OPEN,
    }

    res = client.post(url, req_body, format="json")

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data["message"] == "Need at least 3 players"


def test_post_reroll_pods_malformed_body(client) -> None:
    """Should: fail if our request body is malformed."""

    url = reverse("reroll_pods")

    req_body = {}

    res = client.post(url, req_body, format="json")

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data["message"] == "Missing information to reroll pods"
