import pytest


from sessions_rounds.models import Pods, Rounds, Sessions

from utils.test_helpers import get_ids
from sessions_rounds.helpers import handle_close_round

ids = get_ids()


POD_ID = 1111
WINNING_COMMANDER = "Yarus, Roar of the Old Gods"


@pytest.fixture(scope="function")
def build_pods_round_one():
    Pods.objects.bulk_create(
        [
            Pods(rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN, submitted=True)
            for _ in range(0, 4)
        ]
    )


def test_close_round_one(build_pods_round_one) -> None:
    """
    should: auto close round one if all of the pods are submitted
    """

    round = Rounds.objects.filter(id=ids.R1_SESSION_THIS_MONTH_OPEN).first()

    assert round.completed == False

    handle_close_round(ids.R1_SESSION_THIS_MONTH_OPEN)
    round.refresh_from_db()

    assert round.completed == True


@pytest.fixture(scope="function")
def build_pods_round_two():
    Pods.objects.bulk_create(
        [
            Pods(rounds_id=ids.R2_SESSION_THIS_MONTH_OPEN, submitted=True)
            for _ in range(0, 4)
        ]
    )


def test_close_round_two_session(build_pods_round_two) -> None:
    """
    should: auto close round two and the session if all of the pods are submitted
    """
    round = Rounds.objects.filter(id=ids.R2_SESSION_THIS_MONTH_OPEN).first()
    session = Sessions.objects.filter(id=ids.SESSION_THIS_MONTH_OPEN).first()

    assert round.completed == False
    assert session.closed == False

    handle_close_round(ids.R2_SESSION_THIS_MONTH_OPEN)
    round.refresh_from_db()
    session.refresh_from_db()

    assert round.completed == True
    assert session.closed == True
