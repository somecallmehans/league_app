from django.urls import reverse
from rest_framework import status


def test_get_all_participants(client, seed_db):
    url = reverse("participant_list")

    res = client.get(url)
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert len(parsed_res) == 10


def test_get_one_participant(client):
    url = reverse("participant_list")
    res = client.get(url, {"id": 901})
    parsed_res = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert parsed_res[0]["id"] == 901
    assert parsed_res[0]["name"] == "Charlie Smith"
    assert parsed_res[0]["is_patreon"] is False


def test_upsert_participant_is_patreon_superuser(client):
    url = reverse("upsert_participant")
    payload = {"id": 901, "is_patreon": True}
    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
