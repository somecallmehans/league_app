import pytest

from collections import defaultdict
from django.urls import reverse
from rest_framework import status
from django.db.models import Count

from utils.test_helpers import get_ids

from sessions_rounds.models import Pods, PodsParticipants
from users.models import ParticipantAchievements

ids = get_ids()

round_2_ids = {
    "round_id": ids.R2_SESSION_THIS_MONTH_OPEN,
    "session_id": ids.SESSION_THIS_MONTH_OPEN,
}


def test_post_begin_round_one(client, base_participants_list):
    """Make a post request to begin round one.

    Takes in a list of participants, a session, and a round.
    Uses all of this to make and return pods.

    Round 1- random pairings. Success is our new folks
    getting created + right number of pods getting made.
    """

    url = reverse("begin_round")

    req_body = {
        "participants": base_participants_list
        + [{"name": "BMO"}, {"name": "Jake the Dog"}, {"name": "Finn the Human"}],
        "round": ids.R1_SESSION_THIS_MONTH_OPEN,
        "session": ids.SESSION_THIS_MONTH_OPEN,
    }

    res = client.post(url, req_body, format="json")

    new_pods = Pods.objects.filter(rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)
    pod_ids = [p.id for p in new_pods]
    pods_counts = {
        entry["pods_id"]: entry["count"]
        for entry in PodsParticipants.objects.filter(pods_id__in=pod_ids)
        .values("pods_id")
        .annotate(count=Count("participants_id"))
    }

    new_participation = list(
        ParticipantAchievements.objects.filter(
            round__id=ids.R1_SESSION_THIS_MONTH_OPEN, achievement__id=ids.PARTICIPATION
        ).values_list("earned_points", flat=True)
    )

    assert res.status_code == status.HTTP_201_CREATED
    assert len(new_pods) == 3

    assert pods_counts[1] == 4
    assert pods_counts[2] == 4
    assert pods_counts[3] == 5

    assert len(new_participation) == 13
    assert len(set(new_participation)) == 1


@pytest.mark.parametrize(
    "populate_other_achievements",
    [round_2_ids],
    indirect=True,
)
def test_post_begin_round_two(
    client,
    populate_other_achievements,
    populate_participation,
    base_participants_list,
):
    """
    Make a post request to begin round two

    Takes in a list of participants, a session, and a round.
    Uses all of this to make and return pods.

    Round 2- sorted pairings based on total points. Success is
    new folks get created w/ points and everyone gets
    created in the right order.
    """

    new_participants = [
        {"name": "Princess Bubblegum"},
        {"name": "Marceline the Vampire Queen"},
    ]

    url = reverse("begin_round")

    req_body = {
        "participants": base_participants_list + new_participants,
        "round": ids.R2_SESSION_THIS_MONTH_OPEN,
        "session": ids.SESSION_THIS_MONTH_OPEN,
    }

    expected_pods = {
        1: ["Fern Penvarden", "Charlie Smith", "Jeffrey Blackwood", "Fran Brek"],
        2: ["Bless Frankfurt", "Trenna Thain", "Nikita Heape", "Bevon Goldster"],
        3: [
            "Amanda Tinnin",
            "Thom Horn",
            "Princess Bubblegum",
            "Marceline the Vampire Queen",
        ],
    }

    res = client.post(url, req_body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    earned = ParticipantAchievements.objects.filter(
        round_id=ids.R2_SESSION_THIS_MONTH_OPEN,
        achievement_id=ids.PARTICIPATION,
    ).count()

    assert earned == 12

    rows = (
        PodsParticipants.objects.filter(pods__rounds_id=ids.R2_SESSION_THIS_MONTH_OPEN)
        .select_related("participants")
        .values("pods_id", "participants__name")
    )

    actual_pods = defaultdict(list)
    for row in rows:
        actual_pods[row["pods_id"]].append(row["participants__name"])

    for pod_id, expected_names in expected_pods.items():
        assert actual_pods[pod_id] == expected_names


def test_post_begin_round_fail_malformed_body(client):
    """Malformed post body should return 400"""

    url = reverse("begin_round")

    req_body = {}

    res = client.post(url, req_body, format="json")

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data["message"] == "Missing information to begin round."


def test_post_begin_round_fail_not_enough_players(client):
    """Less than 3 players in body should return 400"""
    url = reverse("begin_round")

    req_body = {
        "participants": [{"name": "Beavis"}, {"name": "Butthead"}],
        "round": ids.R1_SESSION_THIS_MONTH_OPEN,
        "session": ids.SESSION_THIS_MONTH_OPEN,
    }

    res = client.post(url, req_body, format="json")

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data["message"] == "Not enough players to begin round."
