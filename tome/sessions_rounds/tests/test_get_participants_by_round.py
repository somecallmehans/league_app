import pytest

from django.urls import reverse
from rest_framework import status

from utils.test_helpers import get_ids

ids = get_ids()


round_1_ids = {
    "round_id": ids.R1_SESSION_THIS_MONTH_OPEN,
    "session_id": ids.SESSION_THIS_MONTH_OPEN,
}


@pytest.mark.parametrize(
    "build_pods_participants",
    [round_1_ids],
    indirect=True,
)
def test_get_participants_by_round(
    client, populate_participation, build_pods_participants, base_participants_list
) -> None:
    """Should: return all participants assigned to pods
    for a given round."""

    participant_names = [p["name"] for p in base_participants_list]

    url = reverse(
        "round_participants", kwargs={"round": ids.R1_SESSION_THIS_MONTH_OPEN}
    )

    res = client.get(url)

    assert res.status_code == status.HTTP_200_OK

    for item in res.json():
        assert item["total_points"] == 3
        assert item["name"] in participant_names


def test_get_participants_by_round_fail(client) -> None:
    """Should: return 400 when we make a request without a round param"""

    url = reverse("round_participants", kwargs={"round": 999999999})
    res = client.get(url)

    assert res.status_code == 400
    assert res.data["message"] == "Round not found for given id"
