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

    rid = ids.R1_SESSION_THIS_MONTH_OPEN
    sid = ids.SESSION_THIS_MONTH_OPEN

    records = [
        ParticipantAchievements(
            participant_id=ids.P5,
            achievement_id=ids.SNACK,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P8,
            achievement_id=ids.SNACK,
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
            participant_id=ids.P3,
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
            participant_id=ids.P3,
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
            participant_id=ids.P3,
            achievement_id=AID5,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P3,
            achievement_id=AID6,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P3,
            achievement_id=AID7,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P3,
            achievement_id=AID9,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P3,
            achievement_id=ids.NO_CREATURES,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P3,
            achievement_id=ids.NO_INSTANTS_SORCERIES,
            round_id=rid,
            session_id=sid,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P3,
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


@pytest.fixture(scope="function")
def draw_state() -> None:
    records = [
        ParticipantAchievements(
            participant_id=pid,
            achievement_id=ids.DRAW,
            round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
            session_id=ids.SESSION_THIS_MONTH_OPEN,
            earned_points=2,
        )
        for pid in [ids.P1, ids.P3, ids.P5, ids.P8]
    ] + [
        ParticipantAchievements(
            participant_id=ids.P3,
            achievement_id=ids.SNACK,
            round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
            session_id=ids.SESSION_THIS_MONTH_OPEN,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P5,
            achievement_id=ids.SNACK,
            round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
            session_id=ids.SESSION_THIS_MONTH_OPEN,
            earned_points=1,
        ),
        ParticipantAchievements(
            participant_id=ids.P5,
            achievement_id=ids.KNOCK_OUT,
            round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
            session_id=ids.SESSION_THIS_MONTH_OPEN,
            earned_points=1,
        ),
    ]

    ParticipantAchievements.objects.bulk_create(records)
    WinningCommanders.objects.create(
        name="END IN DRAW",
        colors_id=None,
        participants_id=None,
        pods_id=POD_ID,
    )


@pytest.fixture(scope="function")
def build_single_state() -> None:
    ParticipantAchievements.objects.create(
        participant_id=ids.P3,
        achievement_id=ids.WIN_TWO_COLORS,
        round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        session_id=ids.SESSION_THIS_MONTH_OPEN,
        earned_points=3,
    )
    Commanders.objects.create(name="TEST GUY", colors_id=ids.GRUUL)
    WinningCommanders.objects.create(
        name="TEST GUY", colors_id=ids.GRUUL, pods_id=POD_ID, participants_id=ids.P3
    )


def test_get_scoresheet_one_commander(
    client, create_pod_and_bridge_records, build_single_state
) -> None:
    """
    should: return the bare essentials for the form to function
    """
    url = reverse(
        "scoresheet",
        kwargs={"round_id": ids.R1_SESSION_THIS_MONTH_OPEN, "pod_id": POD_ID},
    )
    res = client.get(url)
    parsed_res = res.json()
    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == {
        "bring-snack": [],
        "end-draw": False,
        "lend-deck": [],
        "submit-to-discord": [],
        "money-pack": [],
        "knock-out": [],
        "winner": {"id": ids.P3, "name": "Fern Penvarden"},
        "winner-commander": {
            "colors_id": ids.GRUUL,
            "name": "TEST GUY",
        },
        "partner-commander": None,
        "last-in-order": False,
        "commander-damage": False,
        "lose-the-game-effect": False,
        "win-the-game-effect": False,
        "zero-or-less-life": False,
        "winner-achievements": [],
    }


def test_get_scoresheet_two_commanders(
    client, create_pod_and_bridge_records, build_state
) -> None:
    """
    should: get a scoresheet in the shape the frontend expects as the initial state
    for the form.
    """

    url = reverse(
        "scoresheet",
        kwargs={"round_id": ids.R1_SESSION_THIS_MONTH_OPEN, "pod_id": POD_ID},
    )
    res = client.get(url)
    parsed_res = res.json()
    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == {
        "bring-snack": [
            {
                "id": ids.P5,
                "name": "Bevon Goldster",
            },
            {"id": ids.P8, "name": "Bless Frankfurt"},
        ],
        "end-draw": False,
        "lend-deck": [
            {"id": ids.P5, "name": "Bevon Goldster"},
            {"id": ids.P8, "name": "Bless Frankfurt"},
        ],
        "submit-to-discord": [
            {"id": ids.P8, "name": "Bless Frankfurt"},
            {"id": ids.P3, "name": "Fern Penvarden"},
        ],
        "money-pack": [
            {"id": ids.P8, "name": "Bless Frankfurt"},
            {"id": ids.P3, "name": "Fern Penvarden"},
        ],
        "knock-out": [
            {"id": ids.P5, "name": "Bevon Goldster"},
        ],
        "winner": {"id": ids.P3, "name": "Fern Penvarden"},
        "winner-commander": {
            "colors_id": 11,
            "name": "Wilson, Refined Grizzly",
        },
        "partner-commander": {
            "colors_id": 10000,
            "name": "Tavern Brawler",
        },
        "last-in-order": True,
        "commander-damage": True,
        "lose-the-game-effect": True,
        "win-the-game-effect": False,
        "zero-or-less-life": True,
        "winner-achievements": [
            {
                "id": ids.NO_CREATURES,
                "name": "Win with no creatures except your commander",
            },
            {
                "id": ids.NO_INSTANTS_SORCERIES,
                "name": "Win with a deck that has no instants or sorceries",
            },
        ],
    }


def test_get_scoresheet_draw(client, create_pod_and_bridge_records, draw_state) -> None:
    """
    should: get a completed scoresheet for a pod that ended in a draw
    """
    url = reverse(
        "scoresheet",
        kwargs={"round_id": ids.R1_SESSION_THIS_MONTH_OPEN, "pod_id": POD_ID},
    )
    res = client.get(url)
    parsed_res = res.json()

    assert parsed_res == {
        "bring-snack": [
            {
                "id": ids.P3,
                "name": "Fern Penvarden",
            },
            {"id": ids.P5, "name": "Bevon Goldster"},
        ],
        "end-draw": True,
        "lend-deck": [],
        "submit-to-discord": [],
        "money-pack": [],
        "knock-out": [
            {"id": ids.P5, "name": "Bevon Goldster"},
        ],
        "winner": None,
        "winner-commander": None,
        "partner-commander": None,
        "last-in-order": False,
        "commander-damage": False,
        "lose-the-game-effect": False,
        "win-the-game-effect": False,
        "zero-or-less-life": False,
        "winner-achievements": [],
    }
