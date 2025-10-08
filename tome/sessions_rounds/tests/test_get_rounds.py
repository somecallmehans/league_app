import pytest
import pytz

from datetime import datetime
from django.urls import reverse
from rest_framework import status

from users.models import Participants

from utils.test_helpers import get_ids

ids = get_ids()

PARTICIPANT_ID = 9999


def test_get_rounds_no_participant(client) -> None:
    """
    should: get all of the rounds that were ever made that aren't deleted
    """

    url = reverse("get_all_rounds")
    res = client.get(url)
    parsed_res = res.json()

    expected = [
        {
            "id": ids.R2_SESSION_THIS_MONTH_OPEN,
            "round_number": 2,
            "starts_at": "11/10/2024",
        },
        {
            "id": ids.R1_SESSION_THIS_MONTH_OPEN,
            "round_number": 1,
            "starts_at": "11/10/2024",
        },
        {
            "id": ids.R2_SESSION_THIS_MONTH_CLOSED,
            "round_number": 2,
            "starts_at": "11/3/2024",
        },
        {
            "id": ids.R1_SESSION_THIS_MONTH_CLOSED,
            "round_number": 1,
            "starts_at": "11/3/2024",
        },
        {"id": ids.R2_SESSION_LAST_MONTH, "round_number": 2, "starts_at": "10/28/2024"},
        {"id": ids.R1_SESSION_LAST_MONTH, "round_number": 1, "starts_at": "10/28/2024"},
    ]

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == expected


@pytest.fixture(scope="function")
def build_participant() -> None:
    """Generate a participant that was built this month"""
    participant = Participants.objects.create(
        id=PARTICIPANT_ID,
        name="Test Testerson",
    )
    # override the created_at time with our custom date
    participant.created_at = datetime(2024, 11, 1, 0, 0, 0, tzinfo=pytz.UTC)
    participant.save(update_fields=["created_at"])


def test_get_rounds_for_participant(client, build_participant) -> None:
    """
    should: get only rounds for after a participant was created
    """

    url = reverse(
        "get_all_rounds_with_participant", kwargs={"participant_id": PARTICIPANT_ID}
    )
    res = client.get(url)
    parsed_res = res.json()

    expected = [
        {
            "id": ids.R2_SESSION_THIS_MONTH_OPEN,
            "round_number": 2,
            "starts_at": "11/10/2024",
        },
        {
            "id": ids.R1_SESSION_THIS_MONTH_OPEN,
            "round_number": 1,
            "starts_at": "11/10/2024",
        },
        {
            "id": ids.R2_SESSION_THIS_MONTH_CLOSED,
            "round_number": 2,
            "starts_at": "11/3/2024",
        },
        {
            "id": ids.R1_SESSION_THIS_MONTH_CLOSED,
            "round_number": 1,
            "starts_at": "11/3/2024",
        },
    ]

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res == expected


def test_get_rounds_for_participant_fail(client) -> None:
    """
    should: fail if we try to get rounds for a participant that does not exist.
    """

    url = reverse("get_all_rounds_with_participant", kwargs={"participant_id": 456456})
    res = client.get(url)

    assert res.status_code == status.HTTP_400_BAD_REQUEST
