import pytest

from django.urls import reverse
from rest_framework import status

from users.models import Decklists, DecklistsAchievements
from achievements.models import Commanders
from utils.test_helpers import get_ids

ids = get_ids()

D1 = 1
D2 = 2
D3 = 3


@pytest.fixture(scope="function")
def build_state() -> None:
    """Build some decklists"""

    partner = Commanders.objects.create(
        name="Noble Heritage", is_background=True, colors_id=ids.COLORLESS
    )
    companion = Commanders.objects.create(
        name="Umori, the Collector", has_partner=True, colors_id=ids.COLORLESS
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

        assert isinstance(deck["commander_id"], int)
        assert isinstance(deck["commander__name"], str)

        assert deck["partner_id"] is None or isinstance(deck["partner_id"], int)
        assert deck["partner__name"] is None or isinstance(deck["partner__name"], str)

        assert deck["companion_id"] is None or isinstance(deck["companion_id"], int)
        assert deck["companion__name"] is None or isinstance(
            deck["companion__name"], str
        )

        assert deck["participant_id"] is None or isinstance(deck["participant_id"], int)
        assert deck["participant__name"] is None or isinstance(
            deck["participant__name"], str
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


def test_get_decklists_by_color(client, build_state) -> None:
    """
    should: just return decklist info for the provided color
    """

    url = reverse("decklists")
    res = client.get(f"{url}?colors=24")

    assert res.status_code == status.HTTP_200_OK

    parsed_res = res.json()
    assert parsed_res == [
        {
            "commander_img": [
                {
                    "url": "https://cards.scryfall.io/art_crop/front/3/2/326845a7-7502-4dc3-8f3e-867d6c84e931.jpg?1706242292",
                    "artist": "Dmitry Burmak",
                }
            ],
            "partner_img": None,
            "companion_img": [
                {
                    "url": "https://cards.scryfall.io/art_crop/front/7/5/75ac31e0-ac70-4ee6-b2b1-cc445ffa1da9.jpg?1591228489",
                    "artist": "Jehan Choo",
                }
            ],
            "id": 2,
            "name": "Boop",
            "url": "www.moxfield.com/boop",
            "code": "DL-C3D4",
            "commander_id": 52,
            "commander__name": "Yarus, Roar of the Old Gods",
            "partner_id": None,
            "partner__name": None,
            "companion_id": 4,
            "companion__name": "Umori, the Collector",
            "participant__name": None,
            "participant_id": None,
            "points": 4,
        }
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
