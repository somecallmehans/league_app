import pytest
from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import Pods, PodsParticipants
from users.models import ParticipantAchievements
from utils.test_helpers import get_ids

ids = get_ids()

POD_ID = 123
POD_ID_2 = 111


@pytest.fixture(scope="function")
def build_base_state() -> None:
    pod = Pods.objects.create(id=POD_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(pods_id=pod.id, participants_id=pid)
            for pid in [ids.P1, ids.P2, ids.P3]
        ]
    )


def test_post_add_participant_to_pod_with_achievement(client, build_base_state) -> None:
    """
    should: add a player to an existing pod + give them participation points
    """

    url = reverse("update_pod_participants")
    body = {
        "pod_id": POD_ID,
        "participant_id": ids.P4,
        "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    }
    assert not ParticipantAchievements.objects.filter(
        participant_id=ids.P4,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        achievement_id=ids.PARTICIPATION,
    ).exists()

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED
    assert len(list(PodsParticipants.objects.filter(pods_id=POD_ID))) == 4
    assert ParticipantAchievements.objects.filter(
        participant_id=ids.P4,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        achievement_id=ids.PARTICIPATION,
    ).exists()


@pytest.fixture(scope="function")
def add_participation() -> None:
    ParticipantAchievements.objects.create(
        participant_id=ids.P4,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        session_id=ids.SESSION_THIS_MONTH_OPEN,
        achievement_id=ids.PARTICIPATION,
        earned_points=3,
    )


def test_post_add_participant_to_pod_without_achievement(
    client, build_base_state, add_participation
) -> None:
    """
    should: add a player to an existing pod, but don't add new participation
    """
    url = reverse("update_pod_participants")
    body = {
        "pod_id": POD_ID,
        "participant_id": ids.P4,
        "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    }
    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED
    assert len(list(PodsParticipants.objects.filter(pods_id=POD_ID))) == 4


def test_post_fail_missing_id(client) -> None:
    """
    should: fail if we're missing one of the required params
    """

    url = reverse("update_pod_participants")
    body = {
        "pod_id": POD_ID,
        "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    }
    res = client.post(url, body, format="json")

    assert res.data["message"] == "Missing pod id, participant id, or round id"


@pytest.fixture(scope="function")
def build_full_state() -> None:
    Pods.objects.create(id=POD_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)

    PodsParticipants.objects.bulk_create(
        [
            PodsParticipants(pods_id=POD_ID, participants_id=pid)
            for pid in [ids.P1, ids.P2, ids.P3, ids.P5, ids.P6]
        ]
    )


def test_post_fail_full_pod(client, build_full_state) -> None:
    """
    should: fail if the target pod is full
    """

    url = reverse("update_pod_participants")
    body = {
        "pod_id": POD_ID,
        "participant_id": ids.P4,
        "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    }
    res = client.post(url, body, format="json")

    assert res.data["message"] == "Pod already full"


@pytest.fixture(scope="function")
def add_participant_to_round() -> None:
    Pods.objects.create(id=POD_ID_2, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)

    PodsParticipants.objects.create(pods_id=POD_ID_2, participants_id=ids.P4)


def test_post_fail_participant_in_round(
    client, build_base_state, add_participant_to_round
) -> None:
    """
    should: fail if participant is already in another pod in the round
    """

    url = reverse("update_pod_participants")
    body = {
        "pod_id": POD_ID,
        "participant_id": ids.P4,
        "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    }
    res = client.post(url, body, format="json")

    assert res.data["message"] == "Participant already in pod"
