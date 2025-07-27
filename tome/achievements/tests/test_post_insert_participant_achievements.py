import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import WinningCommanders
from utils.test_helpers import get_ids

ids = get_ids()


POD_ID = 1111
WINNING_COMMANDER = "Yarus, Roar of the Old Gods"


def test_insert_winner_deckbuilding_achievements(
    client, get_slug, get_achievements
) -> None:
    """
    should: correctly insert winner info and earned achievements

    body: {
            new: [{achievement_id, participant_id, round_id, session_id, (optional) slug}],
            winInfo: {participant_id, slug},
            winnerInfo: {participant_id, color_id, commander_name, pod_id, session_id}}
        }
    """

    url = reverse("upsert_earned_v2")

    cmdr_dmg_slug = get_slug(ids.CMDR_DMG)
    win_slug = get_slug(ids.WIN_TWO_COLORS)

    body = {
        "new": [
            {
                "achievement_id": ids.NO_CREATURES,
                "participant_id": ids.P1,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
            },
            {
                "achievement_id": ids.KNOCK_OUT,
                "participant_id": ids.P1,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **cmdr_dmg_slug,
            },
        ],
        "winInfo": {"participant_id": ids.P1, **win_slug},
        "winnerInfo": {
            "color_id": ids.GRUUL,
            "commander_name": WINNING_COMMANDER,
            "participant_id": ids.P1,
            "pod_id": POD_ID,
            "session_id": ids.SESSION_THIS_MONTH_OPEN,
        },
    }

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    winning_commander = (
        WinningCommanders.objects.filter(participants_id=ids.P1, pods_id=POD_ID)
        .values("name")
        .first()
    )
    assert get_achievements(ids.P1) == [
        ids.WIN_TWO_COLORS,
        ids.NO_CREATURES,
        ids.CMDR_DMG,
    ]
    assert winning_commander["name"] == WINNING_COMMANDER


def test_insert_draw(client, get_slug, get_achievements) -> None:
    """
    should: correctly insert the draw achievement for everyone in the pod
    """
    url = reverse("upsert_earned_v2")

    draw_slug = get_slug(ids.DRAW)

    body = {
        "new": [
            {
                "achievement_id": ids.DRAW,
                "participant_id": ids.P1,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **draw_slug,
            },
            {
                "achievement_id": ids.DRAW,
                "participant_id": ids.P3,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **draw_slug,
            },
            {
                "achievement_id": ids.DRAW,
                "participant_id": ids.P5,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **draw_slug,
            },
            {
                "achievement_id": ids.DRAW,
                "participant_id": ids.P8,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **draw_slug,
            },
        ],
        "winInfo": {},
        "winnerInfo": {
            "color_id": None,
            "commander_name": "END IN DRAW",
            "participant_id": None,
            "pod_id": POD_ID,
        },
    }

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED
    assert get_achievements(ids.P1, deleted=False) == [ids.DRAW]
    assert get_achievements(ids.P3, deleted=False) == [
        ids.DRAW,
    ]
    assert get_achievements(ids.P5, deleted=False) == [
        ids.DRAW,
    ]
    assert get_achievements(ids.P8, deleted=False) == [ids.DRAW]


def test_insert_participant_achievements(client, get_slug, get_achievements) -> None:
    """
    should: correctly insert achievements for people who weren't the winner
    """

    url = reverse("upsert_earned_v2")

    cmdr_dmg_slug = get_slug(ids.CMDR_DMG)
    win_slug = get_slug(ids.WIN_TWO_COLORS)
    knock_out_slug = get_slug(ids.KNOCK_OUT)
    snack_slug = get_slug(ids.SNACK)

    body = {
        "new": [
            {
                "achievement_id": ids.NO_CREATURES,
                "participant_id": ids.P1,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
            },
            {
                "achievement_id": ids.CMDR_DMG,
                "participant_id": ids.P1,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **cmdr_dmg_slug,
            },
            {
                "achievement_id": ids.KNOCK_OUT,
                "participant_id": ids.P3,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **knock_out_slug,
            },
            {
                "achievement_id": ids.KNOCK_OUT,
                "participant_id": ids.P5,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **knock_out_slug,
            },
            {
                "achievement_id": ids.SNACK,
                "participant_id": ids.P8,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
                **snack_slug,
            },
        ],
        "winInfo": {"participant_id": ids.P1, **win_slug},
        "winnerInfo": {
            "color_id": ids.GRUUL,
            "commander_name": WINNING_COMMANDER,
            "participant_id": ids.P1,
            "pod_id": POD_ID,
            "session_id": ids.SESSION_THIS_MONTH_OPEN,
        },
    }

    res = client.post(url, body, format="json")

    assert res.status_code == status.HTTP_201_CREATED

    assert get_achievements(ids.P1) == [
        ids.WIN_TWO_COLORS,
        ids.NO_CREATURES,
        ids.CMDR_DMG,
    ]
    assert get_achievements(ids.P3) == [ids.KNOCK_OUT]
    assert get_achievements(ids.P5) == [ids.KNOCK_OUT]
    assert get_achievements(ids.P8) == [ids.SNACK]
