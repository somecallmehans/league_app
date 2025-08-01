from django.urls import reverse
from rest_framework import status


def test_get_rounds_by_month(client) -> None:
    """Should: return all of the round data for
    a given month."""

    url = reverse("rounds_by_month", kwargs={"mm_yy": "11-24"})

    res = client.get(url)
    parsed_res = res.json()

    month_keys = list(parsed_res.keys())

    assert res.status_code == status.HTTP_200_OK
    assert month_keys == ["11/3", "11/10"]

    for month in month_keys:
        # Two rounds! Always!
        assert len(parsed_res[month]) == 2


def test_get_rounds_by_month_not_found(client) -> None:
    """Should: return an empty obj we send a month for which no rounds exist"""

    url = reverse("rounds_by_month", kwargs={"mm_yy": "11-94"})

    res = client.get(url)

    assert res.status_code == status.HTTP_200_OK
    assert res.data == {}
