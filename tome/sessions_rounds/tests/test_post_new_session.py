from datetime import datetime

from django.urls import reverse
from rest_framework import status

from unittest import mock
from utils.test_helpers import prune_fields


@mock.patch(
    "sessions_rounds.views.datetime", side_effect=lambda *args, **kw: date(*args, **kw)
)
def test_post_new_session(mock_date, client):
    """Post a session. This action also creates 2 rounds
    associated with it."""

    url = reverse("make_sessions_and_rounds", kwargs={"mm_yy": "new"})

    mocked_today = datetime(2024, 11, 25)
    mock_date.today.return_value = mocked_today

    res = client.post(url)
    parsed_res = res.json()

    expected = {
        "id": 1,
        "month_year": "11-24",
        "rounds": [{"id": 1, "round_number": 1}, {"id": 2, "round_number": 2}],
    }

    assert res.status_code == status.HTTP_201_CREATED
    assert (
        prune_fields(parsed_res, {"id", "month_year", "rounds", "round_number"})
        == expected
    )
