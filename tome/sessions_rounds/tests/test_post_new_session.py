import pytest
from datetime import datetime

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest import mock

from sessions_rounds.models import Sessions


@pytest.mark.django_db(serialized_rollback=True)
@mock.patch(
    "sessions_rounds.views.datetime", side_effect=lambda *args, **kw: date(*args, **kw)
)
def test_post_new_session_no_id(
    mock_date,
):
    client = APIClient()

    url = reverse("make_sessions_and_rounds")

    mocked_today = datetime(2024, 11, 25)
    mock_date.today.return_value = mocked_today

    payload = {}

    response = client.post(url, payload, format="json")
    parsed_res = response.json()

    assert response.status_code == status.HTTP_201_CREATED
    assert parsed_res["id"] == 1 and parsed_res["month_year"] == "11-24"
    assert len(parsed_res["rounds"]) == 2

    session_exists = Sessions.objects.filter(id=1).exists()
    assert session_exists
