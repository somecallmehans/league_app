import pytest

from achievements.models import Achievements
from sessions_rounds.models import Pods, PodsParticipants
from users.models import ParticipantAchievements

from utils.test_helpers import get_ids

ids = get_ids()

POD_ID = 1111


@pytest.fixture
def get_slug():
    def _get(achievement_id):
        return Achievements.objects.filter(id=achievement_id).values("slug").first()

    return _get


@pytest.fixture
def get_achievements():
    def _get(participant_id, session_id=ids.SESSION_THIS_MONTH_OPEN, deleted=False):
        return list(
            ParticipantAchievements.objects.filter(
                participant_id=participant_id,
                session_id=session_id,
                deleted=deleted,
            )
            .order_by("achievement_id")
            .values_list("achievement_id", flat=True)
        )

    return _get


@pytest.fixture(autouse=True, scope="function")
def create_pod_and_bridge_records() -> None:
    """Generate a pod and bridge records for the below tests."""
    Pods.objects.create(id=POD_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)
    PodsParticipants.objects.bulk_create(
        PodsParticipants(pods_id=POD_ID, participants_id=pid)
        for pid in [ids.P1, ids.P3, ids.P5, ids.P8]
    )
