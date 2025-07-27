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
    Achievements.models.create(
        id=WIN_3_COLORS_ID,
        name="Win Three Colors",
        slug=WIN_3_COLORS_SLUG,
        point_value=3,
    )
    Pods.objects.create(
        id=POD_1_ID,
        rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN,
    )
    Pods.objects.create(id=POD_2_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_CLOSED)
    WinningCommanders.objects.create(
        name=WINNING_COMMANDER_NAME,
        colors_id=ids.GRUUL,
        pods_id=POD_1_ID,
        participants_id=ids.P1,
    )
    WinningCommanders.objects.create(
        name="Stangg, Echo Warrior",
        colors_id=ids.GRUUL,
        pods_id=POD_1_ID,
        participants_id=ids.P2,
    )
    WinningCommanders.objects.create(
        name="Hashaton, Scarab's Fist",
        colors_id=ids.ESPER,
        pods_id=POD_2_ID,
        participants_id=ids.P1,
    )
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=WIN_3_COLORS_ID,
                round_id=ids.R1_SESSION_THIS_MONTH_CLOSED,
                session_id=ids.SESSION_THIS_MONTH_CLOSED,
                earned_points=3,
            ),
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.WIN_TWO_COLORS,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=4,
            ),
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.KILL_TABLE,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=1,
            ),
            ParticipantAchievements(
                participant_id=ids.P2,
                achievement_id=ids.KNOCK_OUT,
                round_id=ids.R2_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=5,
            ),
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=ids.KILL_TABLE,
                round_id=ids.R2_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=5,
            ),
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.WIN_TWO_COLORS,
                round_id=ids.R1_SESSION_THIS_MONTH_CLOSED,
                session_id=ids.SESSION_THIS_MONTH_CLOSED,
                earned_points=3,
            ),
        ]
    )
