from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import Pods, PodsParticipants
from users.models import Participants, ParticipantAchievements
from utils.test_helpers import get_ids

ids = get_ids()


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

    existing_pods = list(
        PodsParticipants.objects.filter(pods_id__in=[1, 2, 3])
        .values("pods_id", "participants_id")
        .order_by("pods_id")
    )

    res = client.post(url, req_body, format="json")

    new_pods = list(
        PodsParticipants.objects.filter(pods_id__in=[1, 2, 3])
        .values("pods_id", "participants_id")
        .order_by("pods_id")
    )

    assert res.status_code == status.HTTP_201_CREATED
    # Somewhat flaky assertion but should do the job
    assert new_pods != existing_pods


def test_post_reroll_pods_round_one_new_players(
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

    existing_pods = list(
        PodsParticipants.objects.filter(pods_id__in=[1, 2, 3])
        .values("pods_id", "participants_id")
        .order_by("pods_id")
    )

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

    new_achievements = ParticipantAchievements.objects.filter(
        participant__name__in=[player["name"] for player in new_players],
        achievement_id=ids.PARTICIPATION,
    ).count()

    assert new_achievements == 4
    assert Pods.objects.all().count() == 4
