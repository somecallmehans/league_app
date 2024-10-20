import pytest
from datetime import datetime

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest import mock


@pytest.mark.django_db(serialized_rollback=True)
@mock.patch(
    "sessions_rounds.views.datetime", side_effect=lambda *args, **kw: date(*args, **kw)
)
def test_get_current_session_and_rounds(mock_date, create_base_session_and_rounds):
    client = APIClient()

    url = reverse("make_sessions_and_rounds")

    mocked_today = datetime(2024, 11, 25)
    mock_date.today.return_value = mocked_today

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res["id"] == 51
    assert parsed_res["rounds"][0]["id"] == 11
    assert parsed_res["rounds"][1]["id"] == 12


@pytest.mark.django_db
def test_get_no_session():
    client = APIClient()

    url = reverse("make_sessions_and_rounds")

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert parsed_res["message"] == "Open session for current month not found."
