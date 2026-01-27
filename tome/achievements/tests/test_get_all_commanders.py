import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import Commanders

from utils.test_helpers import get_ids

ids = get_ids()


def test_get_all_commanders(client) -> None:
    """
    Should: return all of the commanders in our db that aren't deleted
    """

    url = reverse("commanders")

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK

    assert parsed_res == {
        "commander_lookup": {
            "Fynn, the Fangbearer": {
                "id": 51,
                "name": "Fynn, the Fangbearer",
                "colors_id": 11,
                "has_partner": False,
                "is_background": False,
            },
            "Yarus, Roar of the Old Gods": {
                "id": 52,
                "name": "Yarus, Roar of the Old Gods",
                "colors_id": 12,
                "has_partner": False,
                "is_background": False,
            },
            "Urza, Chief Artificer": {
                "id": 53,
                "name": "Urza, Chief Artificer",
                "colors_id": 13,
                "has_partner": False,
                "is_background": False,
            },
        },
        "partners": [],
        "companions": [],
        "commanders": [
            {
                "id": 51,
                "name": "Fynn, the Fangbearer",
                "colors_id": 11,
                "has_partner": False,
                "is_background": False,
            },
            {
                "id": 52,
                "name": "Yarus, Roar of the Old Gods",
                "colors_id": 12,
                "has_partner": False,
                "is_background": False,
            },
            {
                "id": 53,
                "name": "Urza, Chief Artificer",
                "colors_id": 13,
                "has_partner": False,
                "is_background": False,
            },
        ],
    }
