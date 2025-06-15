from django.urls import reverse
from rest_framework import status


def test_get_all_participants(client, seed_db):
    url = reverse("participant_list")

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert len(parsed_res) == 1
