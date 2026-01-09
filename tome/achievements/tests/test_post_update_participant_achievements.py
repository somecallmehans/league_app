import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import WinningCommanders
from users.models import ParticipantAchievements
from utils.test_helpers import get_ids

ids = get_ids()


POD_ID = 1111
COMMANDER_ID = 234
WINNING_COMMANDER = "Yarus, Roar of the Old Gods"
NEW_COMMANDER = "Stangg, Echo Warrior"


def generate_achievements_for_participant(
    participant_id: int, achievements: list[int]
) -> None:
    ParticipantAchievements.objects.bulk_create(
        ParticipantAchievements(
            participant_id=participant_id,
            achievement_id=achievement,
            round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
            session_id=ids.SESSION_THIS_MONTH_OPEN,
            earned_points=5,
        )
        for achievement in achievements
    )


@pytest.fixture(autouse=True, scope="function")
def populate_participant_achievements() -> None:
    """Generate existing participation achievements for a pod."""
    generate_achievements_for_participant(
        ids.P1, [ids.CMDR_DMG, ids.WIN_TWO_COLORS, ids.NO_CREATURES]
    )
    generate_achievements_for_participant(ids.P3, [ids.KNOCK_OUT])
    generate_achievements_for_participant(ids.P5, [ids.KNOCK_OUT])
    generate_achievements_for_participant(ids.P8, [ids.SNACK])
    WinningCommanders.objects.create(
        id=COMMANDER_ID,
        name=WINNING_COMMANDER,
        colors_id=ids.GRUUL,
        pods_id=POD_ID,
        participants_id=ids.P1,
    )


def test_update_winner_deckbuilding_achievements(
    client, get_slug, get_achievements
) -> None:
    """
    should: update achievements for a pod's winner
    """

    url = reverse("upsert_earned_v2")

    delete_target = (
        ParticipantAchievements.objects.filter(
            participant_id=ids.P1,
            achievement_id=ids.CMDR_DMG,
            round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        )
        .values("id")
        .first()
    )
    win_slug = get_slug(ids.WIN_TWO_COLORS)

    body = {
        "update": [{"id": delete_target["id"], "deleted": True}],
        "new": [
            {
                "achievement_id": ids.KILL_TABLE,
                "participant_id": ids.P1,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
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

    assert get_achievements(ids.P1, deleted=False) == [
        ids.KILL_TABLE,
        ids.NO_CREATURES,
        ids.WIN_TWO_COLORS,
    ]
    assert get_achievements(ids.P1, deleted=True) == [ids.CMDR_DMG]


def test_update_pod_winner(client, get_slug, get_achievements) -> None:
    """
    should: update the winner of a given pod
    """

    url = reverse("upsert_earned_v2")

    # For testing purposes this is a little more jank, but the idea is
    # that if you were the winner and aren't anymore you lose all of your deckbuilding
    # achievements/etc
    # however we don't want to delete the win achievement bc thatll just get associated
    # with the new winner
    delete_targets = list(
        ParticipantAchievements.objects.filter(
            participant_id=ids.P1,
            round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        )
        .exclude(achievement_id=ids.WIN_TWO_COLORS)
        .values_list("id", flat=True)
    )
    win_slug = get_slug(ids.WIN_TWO_COLORS)

    body = {
        "update": [{"id": id, "deleted": True} for id in delete_targets],
        "new": [
            {
                "achievement_id": ids.KILL_TABLE,
                "participant_id": ids.P3,
                "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session_id": ids.SESSION_THIS_MONTH_OPEN,
            },
        ],
        "winInfo": {"participant_id": ids.P3, **win_slug},
        "winnerInfo": {
            "id": COMMANDER_ID,
            "color_id": ids.GRUUL,
            "commander_name": NEW_COMMANDER,
            "participant_id": ids.P3,
            "pod_id": POD_ID,
            "session_id": ids.SESSION_THIS_MONTH_OPEN,
        },
    }

    res = client.post(url, body, format="json")

    winning_commander = WinningCommanders.objects.filter(id=COMMANDER_ID).first()

    assert res.status_code == status.HTTP_201_CREATED
    assert get_achievements(ids.P1, deleted=True) == [
        ids.NO_CREATURES,
        ids.CMDR_DMG,
    ]
    assert get_achievements(ids.P3, deleted=False) == [
        ids.KILL_TABLE,
        ids.KNOCK_OUT,
        ids.WIN_TWO_COLORS,
    ]
    assert winning_commander.participants_id == ids.P3
    assert winning_commander.name == NEW_COMMANDER


def test_update_to_draw(client, get_slug, get_achievements) -> None:
    """
    should: update a pod to a draw. should wipe out all previous winner data
    and award everyone a draw achievement.
    """
    url = reverse("upsert_earned_v2")

    # As opposed to the other test, we will be removing the win achievement here.
    delete_targets = list(
        ParticipantAchievements.objects.filter(
            round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
        )
        # but we DONT want to remove any "non deckbuilding achievements"
        .exclude(achievement_id__in=[ids.SNACK, ids.KNOCK_OUT]).values_list(
            "id", flat=True
        )
    )
    draw_slug = get_slug(ids.DRAW)

    body = {
        "update": [{"id": id, "deleted": True} for id in delete_targets],
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
            "id": COMMANDER_ID,
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
        ids.KNOCK_OUT,
    ]
    assert get_achievements(ids.P5, deleted=False) == [
        ids.DRAW,
        ids.KNOCK_OUT,
    ]
    assert get_achievements(ids.P8, deleted=False) == [ids.DRAW, ids.SNACK]
