import pytest
from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import Pods, PodsParticipants
from users.models import Participants, ParticipantAchievements
from utils.test_helpers import get_ids, prune_fields

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
    {"pods_id": 1, "participants_id": 906},
    {"pods_id": 1, "participants_id": 901},
    {"pods_id": 1, "participants_id": 903},
    {"pods_id": 1, "participants_id": 909},
    {"pods_id": 2, "participants_id": 904},
    {"pods_id": 2, "participants_id": 908},
    {"pods_id": 2, "participants_id": 902},
    {"pods_id": 3, "participants_id": 905},
    {"pods_id": 3, "participants_id": 910},
    {"pods_id": 3, "participants_id": 907},
]


@pytest.mark.parametrize(
    ("populate_other_achievements"),
    [round_2_ids],
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

    for id in [ids.P1, ids.P3, ids.P6, ids.P9]:
        assert id in top_pod
