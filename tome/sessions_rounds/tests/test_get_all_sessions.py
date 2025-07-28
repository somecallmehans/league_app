from django.urls import reverse
from rest_framework import status

from utils.test_helpers import prune_fields


def test_get_all_sessions(client):
    """Get all sessions by month"""
    url = reverse("all_sessions")

    res = client.get(url)
    parsed_res = res.json()

    expected = {
        "11-24": [
            {
                "id": 103,
                "month_year": "11-24",
                "rounds": [
                    {
                        "id": 115,
                        "round_number": 1,
                    },
                    {
                        "id": 116,
                        "round_number": 2,
                    },
                ],
            },
            {
                "id": 102,
                "month_year": "11-24",
                "rounds": [
                    {
                        "id": 113,
                        "round_number": 1,
                    },
                    {
                        "id": 114,
                        "round_number": 2,
                    },
                ],
            },
        ],
        "10-24": [
            {
                "id": 101,
                "month_year": "10-24",
                "rounds": [
                    {
                        "id": 111,
                        "round_number": 1,
                    },
                    {
                        "id": 112,
                        "round_number": 2,
                    },
                ],
            }
        ],
    }

    assert res.status_code == status.HTTP_200_OK
    assert list(parsed_res.keys()) == ["11-24", "10-24"]
    assert len(parsed_res["11-24"]) == 2
    assert (
        prune_fields(parsed_res, {"id", "month_year", "rounds", "round_number"})
        == expected
    )
