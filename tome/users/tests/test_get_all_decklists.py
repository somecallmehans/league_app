from datetime import datetime, timezone

import pytest

from django.urls import reverse
from rest_framework import status

from users.models import Decklists, DecklistsAchievements
from achievements.models import Commanders, Colors, WinningCommanders
from sessions_rounds.models import Pods
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
        id=99,
        symbol="wubg",
        slug="i do not care",
        name="whiteblueblackgreen",
        mask=23,
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
    assert isinstance(response_data, dict)
    assert "results" in response_data
    assert "count" in response_data
    assert "page" in response_data
    assert "page_size" in response_data
    decks = response_data["results"]
    assert isinstance(decks, list)
    assert len(decks) > 0

    for deck in decks:
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
    assert parsed_res["count"] >= len(parsed_res["results"])


def strip_imgs(deck):
    deck = dict(deck)
    deck.pop("commander_img", None)
    deck.pop("partner_img", None)
    deck.pop("companion_img", None)
    return deck


def test_get_decklists_by_color(client, build_state) -> None:
    """Exactly these colors is the default: red-green is only red-green."""

    url = reverse("decklists")
    res = client.get(f"{url}?colors=24")

    assert res.status_code == status.HTTP_200_OK

    body = res.json()
    parsed_res = [strip_imgs(d) for d in body["results"]]

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
    ]


def test_colorless_filter_matches_only_colorless_identity(client, build_state) -> None:
    """Colorless means a colorless identity in both match modes."""

    colorless = Commanders.objects.create(
        name="Hope of Ghirapur", color_id=ids.COLORLESS
    )
    Decklists.objects.create(
        name="No Colors",
        url="www.moxfield.com/none",
        commander=colorless,
    )

    url = reverse("decklists")
    for match in ("exact", "any"):
        res = client.get(f"{url}?colors=0&color_match={match}")
        assert res.status_code == status.HTTP_200_OK
        assert [deck["name"] for deck in res.json()["results"]] == ["No Colors"]


def test_search_decklists_by_name_commander_or_partner(client, build_state) -> None:
    """Search matches decklist name, commander, and partner, not companion or participant."""

    url = reverse("decklists")

    def names_for(term: str) -> set[str]:
        res = client.get(f"{url}?search={term}")
        assert res.status_code == status.HTTP_200_OK
        return {deck["name"] for deck in res.json()["results"]}

    assert names_for("beep") == {"Beep"}
    assert names_for("yarus") == {"Boop"}
    assert names_for("master chef") == {"Blop"}
    assert names_for("umori") == set()
    assert names_for("Trenna") == set()


def test_admin_search_matches_participant_name(client, build_state) -> None:
    """Admin search still finds a decklist by its participant's name."""

    url = reverse("admin_get_decklists")
    res = client.get(f"{url}?search=Trenna")

    assert res.status_code == status.HTTP_200_OK
    assert {deck["name"] for deck in res.json()} == {"Beep"}


def test_submitted_by_returns_only_named_credit_decklists(client, build_state) -> None:
    """Submitted by keeps that participant's named-credit decklists."""

    Decklists.objects.filter(id=D1).update(give_credit=True)
    Decklists.objects.create(
        name="Secret",
        url="www.moxfield.com/secret",
        commander_id=ids.FYNN,
        participant_id=ids.P2,
        give_credit=False,
    )

    url = reverse("decklists")
    res = client.get(f"{url}?submitted_by={ids.P2}")

    assert res.status_code == status.HTTP_200_OK
    body = res.json()
    assert [deck["name"] for deck in body["results"]] == ["Beep"]
    assert body["results"][0]["participant_name"] == "Trenna Thain"

    hidden = client.get(f"{url}?submitted_by={ids.P5}")
    assert hidden.status_code == status.HTTP_200_OK
    assert hidden.json()["results"] == []


def test_decklist_submitters_lists_named_credit_participants(
    client, build_state
) -> None:
    """The submitter list includes only participants with named credit."""

    Decklists.objects.filter(id=D1).update(give_credit=True)

    res = client.get(reverse("decklist_submitters"))

    assert res.status_code == status.HTTP_200_OK
    assert res.json() == [{"id": ids.P2, "name": "Trenna Thain"}]


def test_get_decklists_matching_any_selected_color(client, build_state) -> None:
    """Any of these colors keeps decklists that include every selected color."""

    naya = Colors.objects.create(
        id=98,
        symbol="rgw",
        slug="red-green-white",
        name="red green white",
        mask=25,
    )
    commander = Commanders.objects.create(
        name="Hazezon, Shaper of Sand", color=naya
    )
    Decklists.objects.create(
        name="Naya",
        url="www.moxfield.com/naya",
        commander=commander,
    )

    url = reverse("decklists")
    res = client.get(f"{url}?colors=24&color_match=any")

    assert res.status_code == status.HTTP_200_OK
    names = {deck["name"] for deck in res.json()["results"]}
    assert names == {"Boop", "Naya"}


def test_decklists_pagination(client, build_state) -> None:
    """Paginated envelope includes count and obeys page / page_size."""
    url = reverse("decklists")
    res = client.get(f"{url}?page=1&page_size=20")
    assert res.status_code == status.HTTP_200_OK
    body = res.json()
    assert body["count"] == 3
    assert body["page"] == 1
    assert body["page_size"] == 20
    assert len(body["results"]) == 3

    res2 = client.get(f"{url}?page=2&page_size=20")
    body2 = res2.json()
    assert body2["count"] == 3
    assert len(body2["results"]) == 0


def test_sort_decklists_by_wins(client, build_state) -> None:
    """Winningest counts linked wins and breaks ties by newest."""

    Decklists.objects.filter(id=D2).update(
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc)
    )
    Decklists.objects.filter(id=D3).update(
        created_at=datetime(2024, 6, 1, tzinfo=timezone.utc)
    )
    Decklists.objects.filter(id=D1).update(
        created_at=datetime(2024, 3, 1, tzinfo=timezone.utc)
    )

    def record_win(decklist_id, *, deleted=False):
        pod = Pods.objects.create(
            rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN,
            store_id=ids.MIMICS_ID,
        )
        WinningCommanders.objects.create(
            name="winner",
            pods=pod,
            participants_id=ids.P1,
            color_id=ids.GRUUL,
            commander_id=ids.YARUS,
            decklist_id=decklist_id,
            store_id=ids.MIMICS_ID,
            deleted=deleted,
        )

    record_win(D2)
    record_win(D2)
    record_win(D3)
    record_win(D1)
    record_win(D1, deleted=True)
    unlinked = Pods.objects.create(
        rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        store_id=ids.MIMICS_ID,
    )
    WinningCommanders.objects.create(
        name="unlinked",
        pods=unlinked,
        participants_id=ids.P1,
        color_id=ids.GREEN,
        commander_id=ids.FYNN,
        store_id=ids.MIMICS_ID,
    )

    res = client.get(f"{reverse('decklists')}?sort_order=wins_desc")

    assert res.status_code == status.HTTP_200_OK
    assert [deck["name"] for deck in res.json()["results"]] == ["Boop", "Blop", "Beep"]


def test_sort_decklists_by_deckbuilding_achievements(client, build_state) -> None:
    """Most achievements counts attached deckbuilding achievements, newest on a tie."""

    Decklists.objects.filter(id=D1).update(
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc)
    )
    Decklists.objects.filter(id=D2).update(
        created_at=datetime(2024, 6, 1, tzinfo=timezone.utc)
    )
    Decklists.objects.filter(id=D3).update(
        created_at=datetime(2024, 3, 1, tzinfo=timezone.utc)
    )

    res = client.get(f"{reverse('decklists')}?sort_order=achievements_desc")

    assert res.status_code == status.HTTP_200_OK
    assert [deck["name"] for deck in res.json()["results"]] == ["Beep", "Boop", "Blop"]


def test_get_decklists_by_name_desc(client, build_state) -> None:
    """
    should: just return decklist info sorted
    """

    url = reverse("decklists")
    res = client.get(f"{url}?sort_order=name_desc")

    assert res.status_code == status.HTTP_200_OK

    parsed_res = res.json()["results"]
    names = [pr["name"] for pr in parsed_res]
    assert names == ["Boop", "Blop", "Beep"]
