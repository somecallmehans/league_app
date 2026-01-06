import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import WinningCommanders, Commanders, Colors
from utils.test_helpers import get_ids

ids = get_ids()


POD_ID = 1111
RED = 10000
CID = 101
PID = 102
COMMANDER = "Wilson, Refined Grizzly"
PARTNER = "Tavern Brawler"


@pytest.fixture(scope="function")
def build_state() -> None:
    Colors.objects.create(id=RED, symbol="r", slug="red", name="red")
    Commanders.objects.create(id=CID, name=COMMANDER, colors_id=ids.GREEN)
    Commanders.objects.create(id=PID, name=PARTNER, colors_id=RED, is_background=True)


def test_insert_scoresheet(client, get_slug, get_achievements, build_state) -> None:
    """
    should: insert scoresheet info for a round. Map achievements with the correct participants who earned them.

    This test supports v3 of our submission functionality.
    """

    url = reverse("upsert_earned_v3")
    winner_id = ids.P3

    body = {
        "bring-snack": [ids.P2, ids.P4],
        "submit-to-discord": [ids.P4, winner_id],
        "lend-deck": [
            ids.P2,
            ids.P4,
        ],
        "knock-out": [
            winner_id,
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
        "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
        "pod_id": POD_ID,
    }

    res = client.post(url, body, format="json")
    assert res.status_code == status.HTTP_201_CREATED

    
