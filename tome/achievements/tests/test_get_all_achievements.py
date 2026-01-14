import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import Achievements

from utils.test_helpers import get_ids

ids = get_ids()


@pytest.fixture(scope="function")
def add_one_deleted_achievement() -> None:
    """Add one deleted achievement for testing reasons."""
    Achievements.objects.create(name="I AM DELETED", point_value=111, deleted=True)


def test_get_all_achievements(client, add_one_deleted_achievement) -> None:
    """
    should: get all our current achievements
    """

    expected_list = [
        {
            "id": 24,
            "name": "Participation",
            "parent_id": None,
            "point_value": 3,
            "slug": "participation",
            "full_name": " Participation",
            "restrictions": [],
        },
        {
            "id": 25,
            "name": "Kill the table",
            "parent_id": None,
            "point_value": 2,
            "slug": None,
            "full_name": " Kill the table",
            "restrictions": [],
        },
        {
            "id": 26,
            "name": "Win with a deck that has no instants or sorceries",
            "parent_id": None,
            "point_value": 5,
            "slug": None,
            "full_name": " Win with a deck that has no instants or sorceries",
            "restrictions": [],
        },
        {
            "id": 27,
            "name": "Win with no creatures except your commander",
            "parent_id": None,
            "point_value": 4,
            "slug": None,
            "full_name": " Win with no creatures except your commander",
            "restrictions": [],
        },
        {
            "id": 28,
            "name": "Win with no lands",
            "parent_id": None,
            "point_value": 9,
            "slug": None,
            "full_name": " Win with no lands",
            "restrictions": [],
        },
        {
            "id": 29,
            "name": "Win with 88 or more basic lands",
            "parent_id": None,
            "point_value": 11,
            "slug": None,
            "full_name": " Win with 88 or more basic lands",
            "restrictions": [],
        },
        {
            "id": 30,
            "name": "Win via commander damage",
            "parent_id": None,
            "point_value": 1,
            "slug": "cmdr-damage",
            "full_name": " Win via commander damage",
            "restrictions": [],
        },
        {
            "id": 31,
            "name": "The game is a draw",
            "parent_id": None,
            "point_value": 3,
            "slug": "end-draw",
            "full_name": " The game is a draw",
            "restrictions": [],
        },
        {
            "id": 32,
            "name": "Brought snack",
            "parent_id": None,
            "point_value": 2,
            "slug": "bring-snack",
            "full_name": " Brought snack",
            "restrictions": [],
        },
        {
            "id": 33,
            "name": "Knock out",
            "parent_id": None,
            "point_value": 2,
            "slug": "knock-out",
            "full_name": " Knock out",
            "restrictions": [],
        },
        {
            "id": 34,
            "name": "Win Two Colors",
            "parent_id": None,
            "point_value": 4,
            "slug": "win-2-colors",
            "full_name": " Win Two Colors",
            "restrictions": [],
        },
    ]

    url = reverse("achievements_restrictions_list")
    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res["data"] == expected_list
