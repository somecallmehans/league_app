import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import Commanders

from utils.test_helpers import get_ids

ids = get_ids()


@pytest.fixture(scope="function")
def populate_commanders():
    Commanders.objects.bulk_create(
        [
            Commanders(name="Syr Ginger, the Meal Ender", colors_id=ids.COLORLESS),
            Commanders(name="Marwyn, the Nurterer", colors_id=ids.GREEN),
            Commanders(name="Stangg, Echo Warrior", colors_id=ids.GRUUL),
            Commanders(
                name="Saruman of Many Colors", colors_id=ids.ESPER, deleted=True
            ),
            Commanders(
                name="Tester, the Background", colors_id=ids.ESPER, is_background=True
            ),
        ]
    )


def test_get_all_commanders(client, populate_commanders) -> None:
    """
    Should: return all of the commanders in our db that aren't deleted
    """

    url = reverse("commanders")

    expected_lookup = {
        "Marwyn, the Nurterer": {
            "colors_id": 11,
            "has_partner": False,
            "id": 2,
            "is_background": False,
            "name": "Marwyn, the Nurterer",
        },
        "Stangg, Echo Warrior": {
            "colors_id": 12,
            "has_partner": False,
            "id": 3,
            "is_background": False,
            "name": "Stangg, Echo Warrior",
        },
        "Syr Ginger, the Meal Ender": {
            "colors_id": 10,
            "has_partner": False,
            "id": 1,
            "is_background": False,
            "name": "Syr Ginger, the Meal Ender",
        },
        "Tester, the Background": {
            "colors_id": 13,
            "has_partner": False,
            "id": 5,
            "is_background": True,
            "name": "Tester, the Background",
        },
    }
    expected_commanders = [
        {
            "colors_id": 10,
            "has_partner": False,
            "id": 1,
            "is_background": False,
            "name": "Syr Ginger, the Meal Ender",
        },
        {
            "colors_id": 11,
            "has_partner": False,
            "id": 2,
            "is_background": False,
            "name": "Marwyn, the Nurterer",
        },
        {
            "colors_id": 12,
            "has_partner": False,
            "id": 3,
            "is_background": False,
            "name": "Stangg, Echo Warrior",
        },
        {
            "colors_id": 13,
            "has_partner": False,
            "id": 5,
            "is_background": True,
            "name": "Tester, the Background",
        },
    ]
    expected_partners = [
        {
            "colors_id": 13,
            "has_partner": False,
            "id": 5,
            "is_background": True,
            "name": "Tester, the Background",
        },
    ]

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res["commanders"] == expected_commanders
    assert parsed_res["commander_lookup"] == expected_lookup
    assert parsed_res["partners"] == expected_partners
