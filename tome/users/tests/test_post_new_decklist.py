import pytest

from rest_framework.test import APIClient

from django.urls import reverse
from rest_framework import status
from utils.test_helpers import get_ids


ids = get_ids()

NEW_NAME = "NEW DECKLIST!"


@pytest.fixture(scope="function")
def safe_client():
    api = APIClient()
    api.credentials(HTTP_X_PARTICIPANT_CODE="ABCDEF")
    return api


@pytest.fixture(scope="function")
def unsafe_client():
    api = APIClient()
    api.credentials(HTTP_X_PARTICIPANT_CODE="ZZZZZZ")
    return api


def test_post_new_decklist(safe_client) -> None:
    """
    should: post a new decklist record with achievements
    """

    url = reverse("decklists")
    body = {
        "name": NEW_NAME,
        "url": "www.moxfield.com/abcdefg",
        "commander": ids.YARUS,
        "partner": None,
        "companion": None,
        "achievements": [ids.NO_INSTANTS_SORCERIES, ids.NO_LANDS],
        "give_credit": True,
    }
    res = safe_client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    get_res = safe_client.get(url)
    parsed_get = get_res.json()

    for p in parsed_get:
        assert p["points"] == 14
        assert p["name"] == NEW_NAME
        assert p["commander_name"] == "Yarus, Roar of the Old Gods"


def test_post_new_decklist_unsafe(unsafe_client) -> None:
    """
    should: reject request w/o a valid code
    """

    url = reverse("decklists")
    body = {
        "name": NEW_NAME,
        "url": "www.google.com/decklists",
        "commander": ids.YARUS,
        "partner": None,
        "companion": None,
        "achievements": [ids.NO_INSTANTS_SORCERIES, ids.NO_LANDS],
        "give_credit": True,
    }
    res = unsafe_client.post(url, body, format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
