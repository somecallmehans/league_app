from datetime import datetime

from django.urls import reverse
from rest_framework import status
from unittest import mock


@mock.patch(
    "sessions_rounds.views.datetime", side_effect=lambda *args, **kw: date(*args, **kw)
)
def test_get_current_session(mock_date, client):
    """Get the session for the current date when we
    don't provide a mm_yy to the endpoint."""

    url = reverse("make_sessions_and_rounds")

    mocked_today = datetime(2024, 11, 25)
    mock_date.today.return_value = mocked_today

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res["id"] == 103
    assert len(parsed_res["rounds"]) == 2


@mock.patch(
    "sessions_rounds.views.datetime", side_effect=lambda *args, **kw: date(*args, **kw)
)
def test_get_session_by_mm_yy(mock_date, client):
    """Get the session for a provided mm_yy."""

    url = reverse("make_sessions_and_rounds", kwargs={"mm_yy": "10-24"})
    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res["month_year"] == "10-24"


@mock.patch(
    "sessions_rounds.views.datetime", side_effect=lambda *args, **kw: date(*args, **kw)
)
def test_get_no_session(mock_date, client):
    """If we don't have a session for the current month yet, return
    an error"""
    url = reverse("make_sessions_and_rounds", kwargs={"mm_yy": "12-24"})

    mocked_today = datetime(2024, 12, 25)
    mock_date.today.return_value = mocked_today

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert parsed_res["message"] == "Open session for current month not found."


def test_get_months(client):
    """Get a list of months based on our recorded sessions."""

    url = reverse("unique_months")

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == ["10-24", "11-24"]
