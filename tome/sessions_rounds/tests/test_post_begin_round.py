import pytest
from datetime import datetime

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest import mock

from users.models import Participants
from users.serializers import ParticipantsSerializer

from achievements.models import Achievements
from sessions_rounds.models import Sessions, Rounds
from sessions_rounds.serializers import RoundsSerializer, SessionSerializer
from sessions_rounds.helpers import generate_pods

test_participants_no_id = [
    {"name": "Celestia Clearie"},
    {"name": "Gilbert Loxton"},
    {"name": "Sammie Cruikshanks"},
]


@pytest.mark.django_db(serialized_rollback=True)
@mock.patch("users.models.datetime", side_effect=lambda *args, **kw: date(*args, **kw))
def test_post_begin_round(
    mock_date, create_base_participants, create_base_session_and_rounds
):
    """Begin a new round where everyone gets participation points."""
    client = APIClient()
    url = reverse("begin_round")

    mocked_today = datetime(2024, 11, 25)
    mock_date.today.return_value = mocked_today

    session = Sessions.objects.get(id=51)
    round = Rounds.objects.get(id=11)
    Achievements.objects.create(
        id=24, name="Participation Trophy", point_value=3, parent_id=None
    )

    session_serializer = SessionSerializer(session)
    round_serializer = RoundsSerializer(round)

    p_data = Participants.objects.all()
    p_serialized = ParticipantsSerializer(p_data, many=True)
    p_to_send = [{"id": p["id"], "name": p["name"]} for p in p_serialized.data]
    payload = {
        "round": round_serializer.data["id"],
        "session": session_serializer.data["id"],
        "participants": p_to_send + test_participants_no_id,
    }

    response = client.post(url, payload, format="json")

    parsed_res = response.json()
    assert response.status_code == status.HTTP_201_CREATED
    assert len(parsed_res[0]) == 4
    assert len(parsed_res[1]) == 3
