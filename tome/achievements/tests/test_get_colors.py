import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import Commanders

from utils.test_helpers import get_ids

ids = get_ids()


def test_get_all_colors(client) -> None:
    """
    should: return all of the colors in the db (via 600_colors)
    """

    expected_list = [
        {"id": ids.COLORLESS, "name": "Colorless", "symbol": "c", "symbol_length": 0},
        {"id": ids.GREEN, "name": "Green", "symbol": "g", "symbol_length": 1},
        {"id": ids.GRUUL, "name": "Red Green", "symbol": "rg", "symbol_length": 2},
        {
            "id": ids.ESPER,
            "name": "White Blue Black",
            "symbol": "wub",
            "symbol_length": 3,
        },
    ]
    expected_object_by_id = {
        "10": {
            "id": ids.COLORLESS,
            "name": "Colorless",
            "symbol": "c",
            "symbol_length": 0,
        },
        "11": {"id": ids.GREEN, "name": "Green", "symbol": "g", "symbol_length": 1},
        "12": {
            "id": ids.GRUUL,
            "name": "Red Green",
            "symbol": "rg",
            "symbol_length": 2,
        },
        "13": {
            "id": ids.ESPER,
            "name": "White Blue Black",
            "symbol": "wub",
            "symbol_length": 3,
        },
    }
    expected_object_by_symbol = {
        "c": ids.COLORLESS,
        "g": ids.GREEN,
        "rg": ids.GRUUL,
        "wub": ids.ESPER,
    }

    url = reverse("colors")
    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res["list"] == expected_list
    assert parsed_res["idObj"] == expected_object_by_id
    assert parsed_res["symbolObj"] == expected_object_by_symbol
