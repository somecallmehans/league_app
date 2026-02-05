import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import WinningCommanders, Commanders, Colors, Achievements
from utils.test_helpers import get_ids

ids = get_ids()


POD_ID = 1111
RED = 10000
CID = 101
PID = 102
COMMANDER = "Wilson, Refined Grizzly"
PARTNER = "Tavern Brawler"

AID2 = 132
AID3 = 133
AID4 = 134
AID5 = 135
AID6 = 136
AID7 = 137
AID8 = 138
AID9 = 139
DRAWID = 140


@pytest.fixture(scope="function")
def build_state() -> None:
    Colors.objects.create(id=RED, symbol="r", slug="red", name="red", mask=8)
    Commanders.objects.create(id=CID, name=COMMANDER, color_id=ids.GREEN)
    Commanders.objects.create(id=PID, name=PARTNER, color_id=RED, is_background=True)
    Achievements.objects.bulk_create(
        [
            Achievements(id=AID2, name="Lend deck", slug="lend-deck", point_value=2),
            Achievements(
                id=AID3,
                name="Submit a deck to discord",
                slug="submit-to-discord",
                point_value=2,
            ),
            Achievements(
                id=AID4, name="HIGH ROLLER!", slug="money-pack", point_value=3
            ),
            Achievements(id=AID5, name="Go last", slug="last-in-order", point_value=3),
            Achievements(
                id=AID6,
                name="Commander Damage Kill",
                slug="commander-damage",
                point_value=2,
            ),
            Achievements(
                id=AID7,
                name="Lose the game effect",
                slug="lose-the-game-effect",
                point_value=2,
            ),
            Achievements(
                id=AID8,
                name="Win the game effect",
                slug="win-the-game-effect",
                point_value=3,
            ),
            Achievements(
                id=AID9,
                name="Zero or less life",
                slug="zero-or-less-life",
                point_value=3,
            ),
        ]
    )


def test_insert_scoresheet(client, get_slug, get_achievements, build_state) -> None:
    """
    should: insert scoresheet info for a round. Map achievements with the correct participants who earned them.

    This test supports v3 of our submission functionality.
    """

    url = reverse(
        "scoresheet",
        kwargs={"round_id": ids.R1_SESSION_THIS_MONTH_OPEN, "pod_id": POD_ID},
    )
    winner_id = ids.P3

    body = {
        "bring-snack": [ids.P2, ids.P4],
        "submit-to-discord": [ids.P4, winner_id],
        "lend-deck": [
            ids.P2,
            ids.P4,
        ],
        "knock-out": [
            ids.P2,
        ],
        "money-pack": [ids.P4, winner_id],
        "end-draw": False,
        "winner": winner_id,
        "winner-commander": CID,
        "partner-commander": PID,
        "last-in-order": True,
        "commander-damage": True,
        "lose-the-game-effect": True,
        "win-the-game-effect": True,
        "zero-or-less-life": True,
        "winner-achievements": [
            ids.NO_CREATURES,
            ids.NO_INSTANTS_SORCERIES,
        ],
    }

    res = client.post(url, body, format="json")
    assert res.status_code == status.HTTP_201_CREATED

    assert get_achievements(winner_id) == [
        ids.NO_INSTANTS_SORCERIES,
        ids.NO_CREATURES,
        ids.WIN_TWO_COLORS,
        AID3,
        AID4,
        AID5,
        AID6,
        AID7,
        AID8,
        AID9,
    ]

    assert get_achievements(ids.P2) == [ids.SNACK, ids.KNOCK_OUT, AID2]
    assert get_achievements(ids.P4) == [ids.SNACK, AID2, AID3, AID4]

    winning_commander = (
        WinningCommanders.objects.filter(participants_id=winner_id, pods_id=POD_ID)
        .values("name", "color_id")
        .first()
    )

    assert winning_commander["name"] == f"{COMMANDER}+{PARTNER}"
    assert winning_commander["color_id"] == ids.GRUUL


def test_insert_scoresheet_draw(
    client, get_achievements, create_pod_and_bridge_records, build_state
) -> None:
    """Should: Mark a round as a draw in addition to other pod achievements."""

    url = reverse(
        "scoresheet",
        kwargs={"round_id": ids.R1_SESSION_THIS_MONTH_OPEN, "pod_id": POD_ID},
    )

    body = {
        "bring-snack": [ids.P1, ids.P3],
        "submit-to-discord": [ids.P5],
        "lend-deck": [
            ids.P1,
            ids.P3,
        ],
        "knock-out": [
            ids.P1,
        ],
        "money-pack": [ids.P5],
        "end-draw": True,
        "winner": None,
        "winner-commander": None,
        "partner-commander": None,
        "last-in-order": None,
        "commander-damage": None,
        "lose-the-game-effect": None,
        "win-the-game-effect": None,
        "zero-or-less-life": None,
        "winner-achievements": None,
    }

    res = client.post(url, body, format="json")
    assert res.status_code == status.HTTP_201_CREATED

    assert get_achievements(ids.P1) == [ids.DRAW, ids.SNACK, ids.KNOCK_OUT, AID2]
    assert get_achievements(ids.P3) == [ids.DRAW, ids.SNACK, AID2]
    assert get_achievements(ids.P5) == [ids.DRAW, AID3, AID4]
    assert get_achievements(ids.P8) == [ids.DRAW]
