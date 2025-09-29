from django.urls import reverse
from rest_framework import status

from utils.test_helpers import prune_fields


def test_post_new_session(client):
    """Post a session. This action also creates 2 rounds
    associated with it."""

    url = reverse("make_sessions_and_rounds", kwargs={"mm_yy": "new"})
    body = {"session_date": "2024-11-25"}

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    expected = {
        "id": 1,
        "month_year": "11-24",
        "rounds": [{"id": 1, "round_number": 1}, {"id": 2, "round_number": 2}],
        "session_date": "2024-11-25",
    }

    assert res.status_code == status.HTTP_201_CREATED

    assert (
        prune_fields(
            parsed_res, {"id", "month_year", "rounds", "round_number", "session_date"}
        )
        == expected
    )
