import pytest

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from sessions_rounds.models import Sessions, Rounds
from sessions_rounds.serializers import SessionSerializer, RoundsSerializer


@pytest.mark.django_db(serialized_rollback=True)
def test_post_close_round_one(create_base_session_and_rounds):
    """Close round one, leave the session open."""

    client = APIClient()
    url = reverse("close_round")

    session_data = Sessions.objects.all()
    round_data = Rounds.objects.all()
    sessions = SessionSerializer(session_data, many=True)
    rounds = RoundsSerializer(round_data, many=True)

    payload = {
        "session": sessions.data[0]["id"],
        "round": {
            "id": rounds.data[0]["id"],
            "round_number": rounds.data[0]["round_number"],
        },
    }

    response = client.post(url, payload, format="json")
    round_test = Rounds.objects.get(id=rounds.data[0]["id"])
    session_test = Sessions.objects.get(id=sessions.data[0]["id"])
    assert response.status_code == status.HTTP_201_CREATED
    assert round_test.completed == True
    assert session_test.closed == False


@pytest.mark.django_db(serialized_rollback=True)
def test_post_close_round_two_and_session(create_base_session_and_rounds):
    """Close round one, leave the session open."""

    client = APIClient()
    url = reverse("close_round")

    session_data = Sessions.objects.all()
    round_data = Rounds.objects.all()
    sessions = SessionSerializer(session_data, many=True)
    rounds = RoundsSerializer(round_data, many=True)

    payload = {
        "session": sessions.data[0]["id"],
        "round": {
            "id": rounds.data[1]["id"],
            "round_number": rounds.data[1]["round_number"],
        },
    }

    response = client.post(url, payload, format="json")
    round_test = Rounds.objects.get(id=rounds.data[1]["id"])
    session_test = Sessions.objects.get(id=sessions.data[0]["id"])
    assert response.status_code == status.HTTP_201_CREATED
    assert round_test.completed == True
    assert session_test.closed == True


@pytest.mark.django_db(serialized_rollback=True)
def test_post_close_round_fail():
    """Close round one, leave the session open."""

    client = APIClient()
    url = reverse("close_round")

    payload = {}

    response = client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
