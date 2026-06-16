import pytest

from django.urls import reverse
from rest_framework import status

from users.models import Participants


def test_post_new_participant(client):

    url = reverse("upsert_participant")

    payload = {"name": "John Newguy"}

    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED

    participant_exists = Participants.objects.filter(name="John Newguy").exists()
    assert participant_exists


def test_post_update_participant(client):
    url = reverse("upsert_participant")

    payload = {"id": 901, "name": "Jane Newgirl"}
    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED


def test_post_update_participant_is_patreon_requires_superuser(api_client, db):
    from users.models import Users

    user = Users.objects.create(
        name="storeadmin",
        password="letmein",
        email="admin@example.com",
    )
    user.is_authenticated = True
    user.is_superuser = False
    user.is_staff = True
    api_client.force_authenticate(user=user)

    url = reverse("upsert_participant")
    payload = {"id": 901, "is_patreon": True}
    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_post_new_participant_fail(client):
    url = reverse("upsert_participant")

    payload = {}

    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
