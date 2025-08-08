import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import Achievements, Restrictions, AchievementsRestrictions
from utils.test_helpers import get_ids

ids = get_ids()

NAME = "Brand new achievement"


def test_post_insert_achievement(client) -> None:
    """
    should: post a new achievement.
    """

    url = reverse("upsert_achievements")
    body = {"name": NAME, "point_value": 10, "restrictions": [], "achievements": []}

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
        "type": None,
        "type_id": None,
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
        "type": None,
        "type_id": None,
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


def test_post_insert_with_children(client) -> None:
    """
    should: post a new achievement and its children
    """

    url = reverse("upsert_achievements")
    body = {
        "name": NAME,
        "point_value": 10,
        "restrictions": [],
        "achievements": [{"name": "A CHILD"}, {"name": "ANOTHER CHILD"}],
    }

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    created = Achievements.objects.filter(name=NAME).first()
    children = Achievements.objects.filter(parent_id=created.id)
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
        "type": None,
        "type_id": None,
    }

    assert res.status_code == status.HTTP_201_CREATED
    assert created.name == NAME
    assert created.deleted == False
    assert created.point_value == 10
    assert parsed_res == expected
    assert len(children) == 2
    assert children[0].name == "A CHILD"
    assert children[1].name == "ANOTHER CHILD"


@pytest.fixture(scope="function")
def build_children():
    """build a couple children for the below tests achievement"""
    Achievements.objects.create(id=998, name="CHILD 1", parent_id=ids.NO_CREATURES)
    Achievements.objects.create(id=999, name="CHILD 2", parent_id=ids.NO_CREATURES)


def test_post_update_with_children(client, build_children) -> None:
    """
    should: update the children in an achievements post body
    """
    url = reverse("upsert_achievements")
    body = {
        "id": ids.NO_CREATURES,
        "deleted": True,
        "point_value": 1111,
        "achievements": [
            {"id": 998, "name": "BLAH BLAH"},
            {"id": 999, "name": "BLOOP BLOOP"},
        ],
    }

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    children = Achievements.objects.filter(parent_id=ids.NO_CREATURES)
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
        "type": None,
        "type_id": None,
    }
    assert res.status_code == status.HTTP_201_CREATED
    assert parsed_res == expected
    assert children[0].name == "BLAH BLAH"
    assert children[1].name == "BLOOP BLOOP"
    for child in children:
        assert child.parent_id == ids.NO_CREATURES


def test_post_insert_with_restrictions(client) -> None:
    """
    should: post a new achievement w/ restrictions
    """
    url = reverse("upsert_achievements")
    body = {
        "name": NAME,
        "point_value": 10,
        "restrictions": [{"name": "NO TOUCHING"}, {"name": "GET A JOB"}],
        "achievements": [],
    }

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    created = Achievements.objects.filter(name=NAME).first()
    expected = {
        "id": 1,
        "name": "Brand new achievement",
        "point_value": 10,
        "parent": None,
        "parent_id": None,
        "restrictions": [
            {
                "id": 1,
                "name": "NO TOUCHING",
                "nested": False,
                "url": "",
            },
            {
                "id": 2,
                "name": "GET A JOB",
                "nested": False,
                "url": "",
            },
        ],
        "slug": None,
        "points": 10,
        "full_name": "Brand new achievement",
        "deleted": False,
        "type": None,
        "type_id": None,
    }

    assert res.status_code == status.HTTP_201_CREATED
    assert created.name == NAME
    assert created.deleted == False
    assert created.point_value == 10
    assert parsed_res == expected


@pytest.fixture(scope="function")
def build_restrictions():
    """build a couple children for the below tests achievement"""
    Restrictions.objects.create(id=998, name="foo")
    Restrictions.objects.create(id=999, name="bar")
    AchievementsRestrictions.objects.bulk_create(
        AchievementsRestrictions(achievements_id=ids.ALL_BASICS, restrictions_id=rid)
        for rid in [998, 999]
    )


def test_post_update_with_restrictions(client, build_restrictions) -> None:
    """
    should: update restrictions included in the post body of a request
    """
    url = reverse("upsert_achievements")
    body = {
        "id": ids.ALL_BASICS,
        "restrictions": [
            {"id": 998, "name": "NO TOUCHING"},
            {"id": 999, "name": "GET A JOB", "url": "https://www.linkedin.com/feed/"},
        ],
        "achievements": [],
    }

    res = client.post(url, body, format="json")
    parsed_res = res.json()

    expected = {
        "id": 29,
        "name": "Win with 88 or more basic lands",
        "point_value": 11,
        "parent": None,
        "parent_id": None,
        "restrictions": [
            {
                "id": 998,
                "name": "NO TOUCHING",
                "nested": False,
                "url": "",
            },
            {
                "id": 999,
                "name": "GET A JOB",
                "nested": False,
                "url": "https://www.linkedin.com/feed/",
            },
        ],
        "slug": None,
        "points": 11,
        "full_name": "Win with 88 or more basic lands",
        "deleted": False,
        "type": None,
        "type_id": None,
    }

    assert res.status_code == status.HTTP_201_CREATED
    assert parsed_res == expected
