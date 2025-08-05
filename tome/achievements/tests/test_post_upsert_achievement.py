from django.urls import reverse
from rest_framework import status

from achievements.models import Achievements
from utils.test_helpers import get_ids

ids = get_ids()

NAME = "Brand new achievement"


def test_post_insert_achievement(client) -> None:
    """
    should: post a new achievement.
    """

    url = reverse("upsert_achievements")
    body = {"name": NAME, "point_value": 10}

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    created = Achievements.objects.filter(name=NAME).first()
    expected = {
        "id": 1,
        "name": "Brand new achievement",
        "point_value": 10,
        "parent": None,
        "parent_id": None,
        "restrictions": [],
        "slug": None,
        "points": 10,
        "full_name": "Brand new achievement",
        "deleted": False,
    }

    assert res.status_code == status.HTTP_201_CREATED
    assert created.name == NAME
    assert created.deleted == False
    assert created.point_value == 10
    assert parsed_res == expected


def test_post_update_achievement(client) -> None:
    """
    should: update an existing achievement
    """

    url = reverse("upsert_achievements")
    body = {"id": ids.NO_CREATURES, "deleted": True, "point_value": 1111}

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    updated = Achievements.objects.filter(id=ids.NO_CREATURES).first()
    expected = {
        "id": ids.NO_CREATURES,
        "name": "Win with no creatures except your commander",
        "point_value": 1111,
        "parent": None,
        "parent_id": None,
        "restrictions": [],
        "slug": None,
        "points": 1111,
        "full_name": "Win with no creatures except your commander",
        "deleted": True,
    }
    assert res.status_code == status.HTTP_201_CREATED
    assert updated.deleted == True
    assert updated.point_value == 1111
    assert parsed_res == expected


def test_post_insert_no_name(client) -> None:
    """
    should: return bad request when we try to post w/o a name.
    """

    url = reverse("upsert_achievements")
    body = {"point_value": 10}

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert parsed_res["message"] == "Missing 'name' for achievement."


def test_post_not_found(client) -> None:
    """
    should: return a bad request when we try to update an achievement
    id that doesn't exist
    """

    url = reverse("upsert_achievements")
    body = {"id": 12345, "point_value": 10}

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert parsed_res["message"] == "Achievement with given ID not found."
