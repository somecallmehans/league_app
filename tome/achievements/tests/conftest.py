import pytest

from sessions_rounds.models import Pods, PodsParticipants

from utils.test_helpers import get_ids

ids = get_ids()

POD_ID = 1111


@pytest.fixture(autouse=True, scope="function")
def create_pod_and_bridge_records() -> None:
    """Generate a pod and bridge records for the below tests."""
    Pods.objects.create(id=POD_ID, rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN)
    PodsParticipants.objects.bulk_create(
        PodsParticipants(pods_id=POD_ID, participants_id=pid)
        for pid in [ids.P1, ids.P3, ids.P5, ids.P8]
    )
