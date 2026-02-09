import pytest

from unittest.mock import patch
from django.urls import reverse
from rest_framework import status

from users.models import Decklists, DecklistsAchievements
from achievements.models import Commanders, Colors
from utils.test_helpers import get_ids

ids = get_ids()

D1 = 1
D2 = 2
D3 = 3


@pytest.fixture(scope="function")
def build_state() -> None:
    """Build some decklists"""

    partner = Commanders.objects.create(
        name="Master Chef", is_background=True, color_id=ids.GREEN
    )
    companion = Commanders.objects.create(
        name="Umori, the Collector", has_partner=True, color_id=ids.COLORLESS
    )

    Colors.objects.create(
        symbol="wubg", slug="i do not care", name="whiteblueblackgreen", mask=23
    )

    Decklists.objects.bulk_create(
        [
            Decklists(
                id=D1,
                name="Beep",
                url="www.moxfield.com/beep",
                code="DL-A1B2",
                commander_id=ids.FYNN,
                participant_id=ids.P2,
            ),
            Decklists(
                id=D2,
                name="Boop",
                url="www.moxfield.com/boop",
                code="DL-C3D4",
                commander_id=ids.YARUS,
                companion=companion,
            ),
            Decklists(
                id=D3,
                name="Blop",
                url="www.moxfield.com/blop",
                code="DL-E5F6",
                commander_id=ids.URZA,
                participant_id=ids.P5,
                companion=companion,
                partner=partner,
            ),
        ]
    )

    DecklistsAchievements.objects.bulk_create(
        [
            DecklistsAchievements(
                achievement_id=ids.NO_INSTANTS_SORCERIES, decklist_id=D1
            ),
            DecklistsAchievements(achievement_id=ids.CMDR_DMG, decklist_id=D1),
            DecklistsAchievements(achievement_id=ids.NO_CREATURES, decklist_id=D1),
            DecklistsAchievements(achievement_id=ids.NO_CREATURES, decklist_id=D2),
            DecklistsAchievements(achievement_id=ids.NO_CREATURES, decklist_id=D3),
        ]
    )


def assert_decklists_response(response_data):
    assert isinstance(response_data, list)
    assert len(response_data) > 0

    for deck in response_data:
        assert isinstance(deck["id"], int)
        assert isinstance(deck["name"], str)
        assert isinstance(deck["url"], str)
        assert isinstance(deck["code"], str)
        assert deck["code"].startswith("DL-")

        assert deck["partner_name"] is None or isinstance(deck["partner_name"], str)

        # assert deck["companion_id"] is None or isinstance(deck["companion_id"], int)
        assert deck["companion_name"] is None or isinstance(deck["companion_name"], str)

        assert deck["participant_name"] is None or isinstance(
            deck["participant_name"], str
        )

        assert isinstance(deck["points"], int)
        assert deck["points"] >= 0

        assert "commander_img" in deck
        assert isinstance(deck["commander_img"], list)

        if deck["commander_img"]:
            img = deck["commander_img"][0]
            assert isinstance(img["url"], str)
            assert img["url"].startswith("http")
            assert isinstance(img["artist"], str)


def test_get_current_decklists(client, build_state) -> None:
    """
    should: return all of the decklist info + total points  `
    """

    url = reverse("decklists")
    res = client.get(url)

    assert res.status_code == status.HTTP_200_OK

    parsed_res = res.json()
    assert_decklists_response(parsed_res)


def strip_imgs(deck):
    deck = dict(deck)
    deck.pop("commander_img", None)
    deck.pop("partner_img", None)
    deck.pop("companion_img", None)
    return deck


def test_get_decklists_by_color(client, build_state) -> None:
    """
    should: just return decklist info for the provided color
    """

    url = reverse("decklists")
    with patch(
        "users.queries.scryfall_request.get_commander_image_urls",
        return_value={},
    ):
        res = client.get(f"{url}?colors=24")

    assert res.status_code == status.HTTP_200_OK

    parsed_res = [strip_imgs(d) for d in res.json()]

    assert parsed_res == [
        {
            "code": "DL-C3D4",
            "color": {"name": "red green", "symbol": "rg", "points": 3},
            "commander_name": "Yarus, Roar of the Old Gods",
            "companion_name": "Umori, the Collector",
            "id": 2,
            "name": "Boop",
            "participant_name": None,
            "partner_name": None,
            "points": 7,
            "url": "www.moxfield.com/boop",
            "achievements": [
                {
                    "id": 27,
                    "name": "Win with no creatures except your commander",
                    "points": 4,
                },
            ],
        },
        {
            "achievements": [
                {
                    "id": 26,
                    "name": "Win with a deck that has no instants or sorceries",
                    "points": 5,
                },
                {
                    "id": 30,
                    "name": "Win via commander damage",
                    "points": 1,
                },
                {
                    "id": 27,
                    "name": "Win with no creatures except your commander",
                    "points": 4,
                },
            ],
            "code": "DL-A1B2",
            "color": {
                "name": "green",
                "points": 4,
                "symbol": "g",
            },
            "commander_name": "Fynn, the Fangbearer",
            "companion_name": None,
            "id": 1,
            "name": "Beep",
            "participant_name": None,
            "partner_name": None,
            "points": 14,
            "url": "www.moxfield.com/beep",
        },
    ]


def test_get_decklists_by_name_desc(client, build_state) -> None:
    """
    should: just return decklist info sorted
    """

    url = reverse("decklists")
    res = client.get(f"{url}?sort_order=name_desc")

    assert res.status_code == status.HTTP_200_OK

    parsed_res = res.json()
    names = [pr["name"] for pr in parsed_res]
    assert names == ["Boop", "Blop", "Beep"]
