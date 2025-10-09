import pytest
from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import Pods, PodsParticipants
from users.models import ParticipantAchievements
from utils.test_helpers import get_ids

ids = get_ids()

POD_ID = 123


@pytest.fixture(scope="function")
def build_base_state() -> None:
    Pods.objects.create(id=POD_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(pods_id=POD_ID, participants_id=pid)
            for pid in [ids.P1, ids.P2, ids.P3, ids.P4]
        ]
    )
    ParticipantAchievements.objects.create(
        participant_id=ids.P4,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        session_id=ids.SESSION_THIS_MONTH_OPEN,
        achievement_id=ids.PARTICIPATION,
        earned_points=3,
    )


def test_delete_participant(client, build_base_state) -> None:
    """
    should: delete a player from an existing pod, as well as their participation points
    """
    url = reverse("delete_pod_participant")
    body = {
        "pod_id": POD_ID,
        "participant_id": ids.P4,
    }

    res = client.delete(url, body, format="json")

    cheev = ParticipantAchievements.objects.filter(
        participant_id=ids.P4,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        session_id=ids.SESSION_THIS_MONTH_OPEN,
        achievement_id=ids.PARTICIPATION,
    ).first()
    participants = PodsParticipants.objects.filter(pods_id=POD_ID).values_list(
        "participants_id", flat=True
    )

    assert res.status_code == status.HTTP_204_NO_CONTENT
    assert cheev.deleted == True
    assert ids.P4 not in participants
