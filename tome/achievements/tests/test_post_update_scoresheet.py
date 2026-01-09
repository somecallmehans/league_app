import pytest

from django.urls import reverse
from rest_framework import status
from achievements.models import WinningCommanders, Commanders, Colors, Achievements
from users.models import ParticipantAchievements
from sessions_rounds.models import Pods

from utils.test_helpers import get_ids


ids = get_ids()

POD_ID = 1111
RED = 10000
CID = 101
PID = 102
COMMANDER = "Wilson, Refined Grizzly"
PARTNER = "Tavern Brawler"

AID1 = 131
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
    Commanders.objects.create(id=CID, name=COMMANDER, colors_id=ids.GREEN)
    Commanders.objects.create(id=PID, name=PARTNER, colors_id=RED, is_background=True)
    Achievements.objects.bulk_create(
        [
            Achievements(
                id=AID1, name="Bring snack", slug="bring-snack", point_value=3
            ),
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


@pytest.fixture(scope="function")
def build_inserted_state(client, build_state) -> dict:
    """
    Build the DB records needed for scoresheet submission, then POST once to create
    the initial submitted state. Returns context useful for assertions.
    """
    rid = ids.R1_SESSION_THIS_MONTH_OPEN
    sid = ids.SESSION_THIS_MONTH_OPEN
    original_winner = ids.P3
    records = [
        ParticipantAchievements(
            participant_id=ids.P5,
            achievement_id=AID1,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P8,
            achievement_id=AID1,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P5,
            achievement_id=AID2,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P8,
            achievement_id=AID2,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P8,
            achievement_id=AID3,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=AID3,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P8,
            achievement_id=AID4,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=AID4,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P5,
            achievement_id=ids.KNOCK_OUT,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=AID5,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=AID6,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=AID7,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=AID8,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=AID9,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=ids.NO_CREATURES,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=ids.NO_INSTANTS_SORCERIES,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=original_winner,
            achievement_id=ids.WIN_TWO_COLORS,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
    ]

    ParticipantAchievements.objects.bulk_create(records)

    WinningCommanders.objects.create(
        name=f"{COMMANDER}+{PARTNER}",
        colors_id=ids.GRUUL,
        participants_id=ids.P3,
        pods_id=POD_ID,
    )

    Pods.objects.filter(id=POD_ID).update(submitted=True)


def test_update_scoresheet(
    client,
    get_achievements,
    create_pod_and_bridge_records,
    build_inserted_state,
) -> None:
    """
    should: allow PUT to change:
      - participant achievements
      - winner + their earned winner slugs
      - winner deckbuilding achievements
      - winning commander row (winner participant + colors/name)
    """

    url = reverse(
        "scoresheet",
        kwargs={"round_id": ids.R1_SESSION_THIS_MONTH_OPEN, "pod_id": POD_ID},
    )
    original_winner_id = ids.P3

    new_winner_id = ids.P1

    body = {
        "bring-snack": [ids.P8],
        "submit-to-discord": [new_winner_id],
        "lend-deck": [ids.P8],
        "knock-out": [ids.P8],  # shift KO to P8
        "money-pack": [new_winner_id],  # shift money-pack to winner
        "end-draw": False,
        "winner": new_winner_id,
        "winner-commander": CID,
        "partner-commander": PID,
        "last-in-order": False,
        "commander-damage": True,
        "lose-the-game-effect": False,
        "win-the-game-effect": True,
        "zero-or-less-life": True,
        "winner-achievements": [ids.NO_CREATURES],
    }
    res = client.put(url, body, format="json")
    assert res.status_code == status.HTTP_201_CREATED

    assert (
        get_achievements(original_winner_id, round_id=ids.R1_SESSION_THIS_MONTH_OPEN)
        == []
    )

    assert get_achievements(new_winner_id, round_id=ids.R1_SESSION_THIS_MONTH_OPEN) == [
        ids.NO_CREATURES,
        ids.WIN_TWO_COLORS,
        AID3,
        AID4,
        AID6,
        AID8,
        AID9,
    ]

    assert get_achievements(ids.P8, round_id=ids.R1_SESSION_THIS_MONTH_OPEN) == [
        ids.KNOCK_OUT,
        AID1,
        AID2,
    ]

    winning_commander = (
        WinningCommanders.objects.filter(pods_id=POD_ID, deleted=False)
        .values("name", "colors_id", "participants_id")
        .first()
    )

    assert winning_commander["participants_id"] == new_winner_id
    assert winning_commander["name"] == f"{COMMANDER}+{PARTNER}"
    assert winning_commander["colors_id"] == ids.GRUUL


def test_update_scoresheet_draw(
    client, get_achievements, create_pod_and_bridge_records, build_inserted_state
) -> None:
    """Should: update a pods records to be a draw"""

    url = reverse(
        "scoresheet",
        kwargs={"round_id": ids.R1_SESSION_THIS_MONTH_OPEN, "pod_id": POD_ID},
    )

    body = {
        "bring-snack": [ids.P8],
        "submit-to-discord": None,
        "lend-deck": [ids.P8],
        "knock-out": [ids.P8],
        "money-pack": None,
        "end-draw": True,
        "winner": None,
        "winner-commander": None,
        "partner-commander": None,
        "last-in-order": False,
        "commander-damage": False,
        "lose-the-game-effect": False,
        "win-the-game-effect": False,
        "zero-or-less-life": False,
        "winner-achievements": None,
    }

    res = client.put(url, body, format="json")
    assert res.status_code == status.HTTP_201_CREATED

    assert get_achievements(ids.P1, round_id=ids.R1_SESSION_THIS_MONTH_OPEN) == [
        ids.DRAW
    ]

    assert get_achievements(ids.P3, round_id=ids.R1_SESSION_THIS_MONTH_OPEN) == [
        ids.DRAW
    ]

    assert get_achievements(ids.P5, round_id=ids.R1_SESSION_THIS_MONTH_OPEN) == [
        ids.DRAW
    ]

    assert get_achievements(ids.P8, round_id=ids.R1_SESSION_THIS_MONTH_OPEN) == [
        ids.DRAW,
        ids.KNOCK_OUT,
        AID1,
        AID2,
    ]
