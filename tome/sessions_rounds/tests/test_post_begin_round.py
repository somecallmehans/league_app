from django.urls import reverse
from rest_framework import status
from django.db.models import Count

from conftest import test_participants

from sessions_rounds.models import Pods, PodsParticipants
from users.models import ParticipantAchievements


def test_post_begin_round_one(client):
    """Make a post request to begin a round.

    Takes in a list of participants, a session, and a round.
    Uses all of this to make and return pods.

    Round 1- random pairings. Success is our new folks
    getting created + right number of pods getting made.
    """

    url = reverse("begin_round")

    req_body = {
        "participants": [{"id": p.id, "name": p.name} for p in test_participants]
        + [{"name": "BMO"}, {"name": "Jake the Dog"}, {"name": "Finn the Human"}],
        "round": 115,
        "session": 103,
    }

    res = client.post(url, req_body, format="json")

    new_pods = Pods.objects.filter(rounds_id=115)
    pod_ids = [p.id for p in new_pods]
    pods_counts = {
        entry["pods_id"]: entry["count"]
        for entry in PodsParticipants.objects.filter(pods_id__in=pod_ids)
        .values("pods_id")
        .annotate(count=Count("participants_id"))
    }

    new_participation = list(
        ParticipantAchievements.objects.filter(
            round__id=115, achievement__id=24
        ).values_list("earned_points", flat=True)
    )

    assert res.status_code == status.HTTP_201_CREATED
    assert len(new_pods) == 3

    assert pods_counts[1] == 4
    assert pods_counts[2] == 4
    assert pods_counts[3] == 5

    assert len(new_participation) == 13
    assert len(set(new_participation)) == 1
