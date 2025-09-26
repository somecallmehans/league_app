import pytest

from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import RoundSignups

from utils.test_helpers import get_ids

ids = get_ids()


@pytest.fixture(scope="function")
def build_state() -> None:
    # Round 1 Signins
    RoundSignups.objects.bulk_create(
        RoundSignups(participant_id=pid, round_id=ids.R1_SESSION_THIS_MONTH_OPEN)
        for pid in [ids.P1, ids.P3, ids.P5, ids.P8]
    )

    # Round 2 Signins
    RoundSignups.objects.bulk_create(
        RoundSignups(participant_id=pid, round_id=ids.R2_SESSION_THIS_MONTH_OPEN)
        for pid in [ids.P1, ids.P2, ids.P3, ids.P5, ids.P8, ids.P7]
    )


def test_get_signin_counts(client, build_state) -> None:
    """
    should: return an object that has r1 info and r2 info: list of participant obj
    and a count
    """
    url = reverse("signin_counts")

    res = client.get(
        f"{url}?round_one={ids.R1_SESSION_THIS_MONTH_OPEN}&round_two={ids.R2_SESSION_THIS_MONTH_OPEN}"
    )

    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res[str(ids.R1_SESSION_THIS_MONTH_OPEN)]["count"] == 4
    assert parsed_res[str(ids.R2_SESSION_THIS_MONTH_OPEN)]["count"] == 6


def test_get_signin_counts_empty(client) -> None:
    """
    should: return empty dicts and count == 0 for r1 and r2
    """
    url = reverse("signin_counts")
    res = client.get(
        f"{url}?round_one={ids.R1_SESSION_THIS_MONTH_OPEN}&round_two={ids.R2_SESSION_THIS_MONTH_OPEN}"
    )

    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res[str(ids.R1_SESSION_THIS_MONTH_OPEN)]["count"] == 0
    assert parsed_res[str(ids.R2_SESSION_THIS_MONTH_OPEN)]["count"] == 0
