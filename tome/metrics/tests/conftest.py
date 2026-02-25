import pytest

from achievements.models import WinningCommanders, Achievements
from users.models import ParticipantAchievements
from sessions_rounds.models import Pods
from utils.test_helpers import get_ids

ids = get_ids()

WIN_3_COLORS_ID = 35
WIN_3_COLORS_SLUG = "win-3-colors"

POD_1_ID = 1111
POD_2_ID = 2222

WINNING_COMMANDER_NAME = "Yarus, Roar of the Old Gods"


@pytest.fixture(autouse=True, scope="function")
def build_state() -> None:
    Achievements.objects.create(
        id=WIN_3_COLORS_ID,
        name="Win Three Colors",
        slug=WIN_3_COLORS_SLUG,
        point_value=3,
    )
    Pods.objects.create(
        id=POD_1_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN, store_id=ids.MIMICS_ID
    )
    Pods.objects.create(
        id=POD_2_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_CLOSED, store_id=ids.MIMICS_ID
    )
    WinningCommanders.objects.create(
        name=WINNING_COMMANDER_NAME,
        color_id=ids.GRUUL,
        pods_id=POD_1_ID,
        participants_id=ids.P1,
        store_id=ids.MIMICS_ID,
    )
    WinningCommanders.objects.create(
        name="Stangg, Echo Warrior",
        color_id=ids.GRUUL,
        pods_id=POD_1_ID,
        participants_id=ids.P2,
        store_id=ids.MIMICS_ID,
    )
    WinningCommanders.objects.create(
        name="Hashaton, Scarab's Fist",
        color_id=ids.ESPER,
        pods_id=POD_2_ID,
        participants_id=ids.P1,
        store_id=ids.MIMICS_ID,
    )
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=WIN_3_COLORS_ID,
                round_id=ids.R1_SESSION_THIS_MONTH_CLOSED,
                session_id=ids.SESSION_THIS_MONTH_CLOSED,
                earned_points=3,
                store_id=ids.MIMICS_ID,
            ),
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.WIN_TWO_COLORS,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=4,
                store_id=ids.MIMICS_ID,
            ),
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.KILL_TABLE,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=1,
                store_id=ids.MIMICS_ID,
            ),
            ParticipantAchievements(
                participant_id=ids.P2,
                achievement_id=ids.KNOCK_OUT,
                round_id=ids.R2_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=5,
                store_id=ids.MIMICS_ID,
            ),
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=ids.KILL_TABLE,
                round_id=ids.R2_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=5,
                store_id=ids.MIMICS_ID,
            ),
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.WIN_TWO_COLORS,
                round_id=ids.R1_SESSION_THIS_MONTH_CLOSED,
                session_id=ids.SESSION_THIS_MONTH_CLOSED,
                earned_points=3,
                store_id=ids.MIMICS_ID,
            ),
        ]
    )
