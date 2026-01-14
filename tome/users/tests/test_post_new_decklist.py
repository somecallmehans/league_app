from django.urls import reverse
from rest_framework import status
from utils.test_helpers import get_ids

from users.models import Decklists

ids = get_ids()

NEW_NAME = "NEW DECKLIST!"


def test_post_new_decklist(client) -> None:
    """
    should: post a new decklist record with achievements
    """

    url = reverse("decklists")
    body = {
        "name": NEW_NAME,
        "url": "www.google.com/decklists",
        "participant_id": None,
        "commander": ids.YARUS,
        "partner": None,
        "companion": None,
        "achievements": [ids.NO_INSTANTS_SORCERIES, ids.NO_LANDS],
    }
    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    get_res = client.get(url)
    parsed_get = get_res.json()

    for p in parsed_get:
        assert p["points"] == 14
        assert p["name"] == NEW_NAME
        assert p["commander_name"] == "Yarus, Roar of the Old Gods"
